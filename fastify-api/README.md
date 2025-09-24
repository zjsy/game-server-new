````markdown
# _PROJECT_NAME_

## Prerequisites

- Node.js v22
- PNPM v10

## Environment Setup

1. Copy the example environment file:
```sh
$ cp .env.example .env
```

2. Edit the `.env` file with your configuration:
```env
NODE_ENV=development
HOST=127.0.0.1
PORT=3000
SITE_URL=http://127.0.0.1:5173
```

## Usage

```sh
$ pnpm install
```

```sh
$ pnpm dev
```

```sh
$ pnpm build
```

```sh
$ pnpm preview
```

```sh
$ pnpm lint
```

```sh
$ pnpm check
```

```sh
$ pnpm test
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `HOST` | Server host | `127.0.0.1` | Yes |
| `PORT` | Server port | `3000` | Yes |
| `SITE_URL` | Site URL for CORS | `http://127.0.0.1:5173` | Yes |
| `DATABASE_URL` | Database connection string | - | No |
| `API_BASE_URL` | External API base URL | - | No |
| `JWT_SECRET` | JWT signing secret | - | No |
| `LOG_LEVEL` | Log level | `info` | No |

````
