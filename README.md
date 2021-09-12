# PorkbunDDNSClient

A dynamic DNS Client made for Porkbun.

環境変数としてPorkbunのAPIキーを設定します。

```sh
export PORKBUN_API_KEY=yourporkbunapikey
export PORKBUN_SECRET_API_KEY=yourporkbunsecretapikey
```

| flag        | shorthand | description                         |
| :---------- | :-------- | :---------------------------------- |
| --domain    | -d        | ドメイン                            |
| --subdomain | -s        | サブドメイン                        |
| --cron      | -c        | デフォルトで 1 日毎に実行されます。 |

## Usage

```sh
deno run --allow-net --allow-read --allow-env ddns.ts \
  -d "example.com"\
  -s"sub"         \
  -c "* * * 1 * *"
```
