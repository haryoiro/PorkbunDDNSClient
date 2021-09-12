# PorkbunDDNSClient

A dynamic DNS Client made for Porkbun.

| flag        | short | required | description               | example               |
| :---------- | :-------- | :------- | :------------------------ | :-------------------- |
| --domain    | -d        | true     | ドメイン                  | -d example.com        |
| --subdomain | -s        | false    | サブドメイン              | -s sub                |
| --apikey    | -k        | true     | Porkbun の API Key        | -k qwertyuiop\_       |
| --secret    | -i        | true     | Porkbun の Secret API Key | -i qwertyuiop_sec     |
| --cron      | -c        | false    | デフォルトは 1 日毎に設定 | -c "\* \* \* 1 \* \*" |

## Usage

sub.example.com の IP アドレスを５日毎に更新する場合。

```sh
deno run --allow-net --allow-env pddns.ts \
  -k pk1_qwertyuiop \
  -i sk1_qwertyuiop \
  -d example.com \
  -s sub \
  -c "* * * 5 * *" # 5日ごとに実行
```

また、API キーとシークレットに関しては、環境変数として設定しておくこともできます。

```sh
export PORKBUN_API_KEY=yourporkbunapikey
export PORKBUN_SECRET_API_KEY=yourporkbunsecretapikey
```
