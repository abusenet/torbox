# TorBox Backend

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Abusenet/torbox)

Backend for TorBox.

## Why?

TorBox provides WebDav that lists files and folders of the user.
However, the user's email and password are used to authenticate with
the WebDav, which is not ideal when sharing with a family or friend.
Moreover, the sharee can see all content of the sharer.

This backend proxies over TorBox's WebDav but provides custom user
management. This can have any number of custom users with their own
username and password, as well as which folders they have access to.