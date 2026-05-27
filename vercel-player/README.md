# neurotech-quit-player

Статический веб-плеер для процедур NeuroTech Quit. Деплоится на Vercel.

## URL

```
/player?procedure=anti_tobacco&playbackId=<MUX_PLAYBACK_ID>&token=<JWT>
```

## Параметры

| Параметр | Обязателен | Описание |
|---|---|---|
| `procedure` | нет | тип процедуры (anti_tobacco, quick_lever, alpha) |
| `playbackId` | да | Mux Signed Playback ID |
| `token` | да | Mux playback JWT (RS256, TTL 2ч), генерируется ботом |

## Деплой

```
cd vercel-player
vercel --prod
```

`PLAYER_BASE_URL` на Bothost должен совпадать с URL деплоя.
