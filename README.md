# PorkbunDDNSClient

A dynamic DNS Client made for Porkbun.

環境変数としてPorkbunのAPIキーを設定します。

```sh
export PORKBUN_API_KEY=yourporkbunapikey
export PORKBUN_SECRET_API_KEY=yourporkbunsecretapikey
```

| flag        | shorthand | description                         |
| :---------- | :-------- | :---------------------------------- |
| --domain    | -d        | ドメイン ex.  example.com                           |
| --subdomain | -s        | サブドメイン ex. sub                       |
| --cron      | -c        | デフォルトは1日毎に設定 |

## Usage

```sh
deno run --allow-net --allow-read --allow-env ddns.ts \
  -d "example.com"\
  -s"sub"         \
  -c "* * * 1 * *"
```
