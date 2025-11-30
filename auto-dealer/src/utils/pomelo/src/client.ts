import { Package, Message, Protocol } from "./protocol";
import { EventEmitter } from "events";
import { Buffer } from "buffer";
import { Protobuf } from "../protobuf/protobuf";
// import { MyWebsocket } from './websocket'

const JS_WS_CLIENT_TYPE = "js-websocket";
const JS_WS_CLIENT_VERSION = "0.0.5";

const RES_OK = 200;
const RES_OLD_CLIENT = 501;
// const CODE_DICT_ERROR = 502
// const CODE_PROTOS_ERROR = 503

export interface IPomeloInterface {
  on(event: "close", cb: any): any;

  on(event: "io-error", cb: any): any;

  on(event: "error", cb: any): any;

  on(event: "heartbeat timeout", cb: any): any;

  on(event: "onKick", cb: any): any;

  initAsync(params: unknown): Promise<any>;

  init(params: unknown, cb: Function);

  disconnect();

  request(route, msg): Promise<any>;

  notify(route, msg);
}

export class Pomelo extends EventEmitter implements IPomeloInterface {
  private SYS_CACHE_STORAGE_KEY = "pomelo-cache-key";
  private socket: WebSocket | null = null;
  private reqId = 0;
  private callbacks: any = {};
  private handlers: any = {};
  // Map from request id to route
  private routeMap = {};
  protobuf: Protobuf | null = null;
  private heartbeatInterval = 5000;
  private heartbeatTimeout: number = this.heartbeatInterval * 2;
  private nextHeartbeatTimeout = 0;
  private gapThreshold = 100; // heartbeat gap threshold
  private heartbeatId: any = null;
  private heartbeatTimeoutId: any = null;
  private handshakeCallback: any = null;

  private handshakeBuffer = {
    sys: {
      type: JS_WS_CLIENT_TYPE,
      version: JS_WS_CLIENT_VERSION,
      dictVersion: "" as any,
      protoVersion: "" as any,
    },
    user: {},
  };

  private initCallback: Function = null;

  data: { dict: any; abbrs: any; protos: any } = {} as any;

  private sysCache: {
    dictVersion: string;
    protoVersion: string;
    dict: any;
    protos: any;
  } = null;

  constructor(private readonly showPackageLog: boolean = true) {
    super();
    this.handlers[Package.TYPE_HANDSHAKE] = this.handshake.bind(this);
    this.handlers[Package.TYPE_HEARTBEAT] = this.heartbeat.bind(this);
    this.handlers[Package.TYPE_DATA] = this.onData.bind(this);
    this.handlers[Package.TYPE_KICK] = this.onKick.bind(this);
  }
  on(event: "close", cb: any);
  on(event: "io-error", cb: any);
  on(event: "error", cb: any);
  on(event: "heartbeat timeout", cb: any);
  on(event: "onKick", cb: any);
  on(_event: unknown, _cb: unknown): any {
    throw new Error("Method not implemented.");
  }

  initAsync(params: {
    url: string;
    user?: object;
    handshakeCallback?: Function;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.initCallback = resolve;
      this.sysCache =
        JSON.parse(localStorage.getItem(this.SYS_CACHE_STORAGE_KEY)) ||
        ({} as any);
      this.handshakeBuffer.sys.dictVersion = this.sysCache.dictVersion || 0;
      this.handshakeBuffer.sys.protoVersion = this.sysCache.protoVersion || 0;

      this.handshakeBuffer.user = params.user;
      this.handshakeCallback = params.handshakeCallback;
      this.initWebSocket(params.url);
      this.addListener("io-error", reject);
    });
  }

  init(
    params: { url: string; user?: object; handshakeCallback?: Function },
    cb
  ) {
    this.initCallback = cb;
    this.sysCache =
      JSON.parse(localStorage.getItem(this.SYS_CACHE_STORAGE_KEY)) ||
      ({} as any);
    this.handshakeBuffer.sys.dictVersion = this.sysCache.dictVersion || 0;
    this.handshakeBuffer.sys.protoVersion = this.sysCache.protoVersion || 0;

    this.handshakeBuffer.user = params.user ?? {};
    this.handshakeCallback = params.handshakeCallback;
    this.initWebSocket(params.url);
  }

  private initWebSocket(url) {
    console.log("init websocket:" + url);
    const onopen = (event) => {
      console.log("[pomeloclient.init] websocket connected!", event);
      const obj = Package.encode(
        Package.TYPE_HANDSHAKE,
        Protocol.strencode(JSON.stringify(this.handshakeBuffer))
      );
      this.send(obj);
    };
    const onmessage = (event) => {
      if (this.showPackageLog && event.data.byteLength != 4) {
        console.log(
          "recv orgdata",
          event.data.byteLength,
          Buffer.from(event.data).toString("hex")
        );
      }
      this.processPackage(Package.decode(event.data));
      // new package arrived, update the heartbeat timeout
      if (this.heartbeatTimeout) {
        this.nextHeartbeatTimeout = Date.now() + this.heartbeatTimeout;
      }
    };
    const onerror = (event) => {
      this.emit("io-error", event);
      console.log("socket error %j ", event);
    };
    const onclose = (event) => {
      this.emit("close", event);
      this.disconnect();
      console.log("socket close %j ", event);
    };

    this.socket = new WebSocket(url);
    this.socket.binaryType = "arraybuffer";
    this.socket.onopen = onopen;
    this.socket.onmessage = onmessage;
    this.socket.onerror = onerror;
    this.socket.onclose = onclose;
  }

  disconnect() {
    if (this.socket) {
      if (this.socket.close) this.socket.close();
      console.log("disconnect");
      this.socket = null;
    }

    if (this.heartbeatId) {
      clearTimeout(this.heartbeatId);
      this.heartbeatId = null;
    }
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }
  }

  request(route, msg): Promise<any> {
    return new Promise((resolve) => {
      msg = msg || {};
      route = route || msg.route;
      if (!route) {
        console.log("fail to send request without route.");
        return;
      }

      this.reqId++;
      this.sendMessage(this.reqId, route, msg);

      this.callbacks[this.reqId] = resolve;
      this.routeMap[this.reqId] = route;
    });
  }

  notify(route, msg) {
    msg = msg || {};
    this.sendMessage(0, route, msg);
  }

  private sendMessage(reqId, route, msg) {
    const type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;
    if (this.showPackageLog) {
      console.log("send", reqId, route, msg);
    }
    //compress message by protobuf
    const protos = this.data.protos ? this.data.protos.client : {};
    if (protos[route]) {
      msg = this.protobuf.encode(route, msg);
    } else {
      msg = Protocol.strencode(JSON.stringify(msg));
    }

    let compressRoute = false;
    if (this.data.dict && this.data.dict[route]) {
      route = this.data.dict[route];
      compressRoute = true;
    }

    msg = Message.encode(reqId, type, compressRoute, route, msg);
    const packet = Package.encode(Package.TYPE_DATA, msg);
    if (this.showPackageLog) {
      console.log("send", "packet", packet.length, packet.toString("hex"));
    }
    this.send(packet);
  }

  private send(packet) {
    if (this.socket) {
      this.socket.send(packet.buffer || packet);
    }
  }

  private heartbeat() {
    const obj = Package.encode(Package.TYPE_HEARTBEAT);
    if (this.heartbeatTimeoutId) {
      clearTimeout(this.heartbeatTimeoutId);
      this.heartbeatTimeoutId = null;
    }

    if (this.heartbeatId) {
      // already in a heartbeat interval
      return;
    }

    this.heartbeatId = setTimeout(() => {
      this.heartbeatId = null;
      this.send(obj);

      this.nextHeartbeatTimeout = Date.now() + this.heartbeatTimeout;
      this.heartbeatTimeoutId = setTimeout(
        this.heartbeatTimeoutCb.bind(this),
        this.heartbeatTimeout
      );
    }, this.heartbeatInterval);
  }

  private heartbeatTimeoutCb() {
    const gap = this.nextHeartbeatTimeout - Date.now();
    if (gap > this.gapThreshold) {
      this.heartbeatTimeoutId = setTimeout(
        this.heartbeatTimeoutCb.bind(this),
        gap
      );
    } else {
      console.error("server heartbeat timeout");
      this.emit("heartbeat timeout");
      this.disconnect();
    }
  }

  private handshake(data) {
    data = JSON.parse(Protocol.strdecode(data));
    if (data.code === RES_OLD_CLIENT) {
      this.emit("error", "client version not fullfill");
      return;
    }

    if (data.code !== RES_OK) {
      this.emit("error", "handshake fail");
      return;
    }

    this.handshakeInit(data);

    const obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
    this.send(obj);
    if (this.initCallback) {
      this.initCallback(this);
      this.initCallback = null;
    }
  }

  private onData(data) {
    //probuff decode
    const msg = Message.decode(data);

    if (msg.id > 0) {
      msg.route = this.routeMap[msg.id];
      delete this.routeMap[msg.id];
      if (!msg.route) {
        return;
      }
    }

    msg.body = this.deCompose(msg);
    if (this.showPackageLog) {
      console.log(
        "recv",
        JSON.stringify(msg),
        "\n\tpacket",
        data.length,
        data.toString("hex")
      );
    }
    this.processMessage(msg);
  }

  private onKick(data) {
    this.emit("onKick", data.toString());
  }

  private processPackage(msg) {
    if (Array.isArray(msg)) {
      for (const m of msg) {
        this.handlers[m.type](m.body);
      }
    } else {
      this.handlers[msg.type](msg.body);
    }
  }

  private processMessage(msg) {
    if (!msg || !msg.id) {
      // server push message 广播消息
      this.emit(msg.route, msg.body);
      return;
    }

    //if have a id then find the callback function with the request
    const cb = this.callbacks[msg.id];

    delete this.callbacks[msg.id];
    if (typeof cb !== "function") {
      return;
    }

    cb(msg.body);
    return;
  }

  // private processMessageBatch(msgs) {
  //   for (let i = 0, l = msgs.length; i < l; i++) {
  //     this.processMessage(msgs[i])
  //   }
  // }

  private deCompose(msg) {
    const protos = this.data.protos ? this.data.protos.server : {};
    const abbrs = this.data.abbrs;
    let route = msg.route;

    try {
      //Decompose route from dict
      if (msg.compressRoute) {
        if (!abbrs[route]) {
          console.error("illegal msg!");
          return {};
        }

        route = msg.route = abbrs[route];
      }
      if (protos[route]) {
        return this.protobuf.decode(route, msg.body);
      } else {
        return JSON.parse(Protocol.strdecode(msg.body));
      }
    } catch (ex) {
      console.error("route, body = " + route + ", " + msg.body);
    }

    return msg;
  }

  private handshakeInit(data) {
    if (data.sys && data.sys.heartbeat) {
      this.heartbeatInterval = data.sys.heartbeat * 1000; // heartbeat interval
      this.heartbeatTimeout = this.heartbeatInterval * 2; // max heartbeat timeout
    } else {
      this.heartbeatInterval = 0;
      this.heartbeatTimeout = 0;
    }

    this.initData(data);

    if (typeof this.handshakeCallback === "function") {
      this.handshakeCallback(data.user);
    }
  }

  //Initilize data used in pomelo client
  private initData(data) {
    if (!data || !data.sys) {
      return;
    }

    const dictVersion = data.sys.dictVersion;
    const protoVersion = data.sys.protos ? data.sys.protos.version : null;

    let changed = false;
    const dict = data.sys.dict || this.sysCache.dict;
    const protos = data.sys.protos || this.sysCache.protos;

    if (dictVersion) {
      this.sysCache.dict = dict;
      this.sysCache.dictVersion = dictVersion;
      changed = true;
    }

    if (protoVersion) {
      this.sysCache.protos = protos;
      this.sysCache.protoVersion = protoVersion;
      changed = true;
    }
    if (changed) {
      localStorage.setItem(
        this.SYS_CACHE_STORAGE_KEY,
        JSON.stringify(this.sysCache)
      );
    }
    //Init compress dict
    if (dict) {
      this.data.dict = dict;
      this.data.abbrs = {};

      for (const route in dict) {
        this.data.abbrs[dict[route]] = route;
      }
    }

    //Init protobuf protos
    if (protos) {
      this.data.protos = {
        server: protos.server || {},
        client: protos.client || {},
      };
      if (!this.protobuf) {
        // 要改WEB JS客户端的话 这里可能需要改一下。
        this.protobuf = new Protobuf({
          encoderProtos: protos.client,
          decoderProtos: protos.server,
        });
      }
    }
  }
}
