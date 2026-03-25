# Redis Persistence Setup

## AOF Persistence (recommended)

Add to `/etc/redis/redis.conf`:

```
appendonly yes
appendfsync everysec
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
```

## RDB Snapshots (backup)

```
save 900 1
save 300 10
save 60 10000
```

## Restart Redis

```bash
sudo systemctl restart redis
```

## Verify Persistence

```bash
redis-cli INFO persistence
```