# export-eiga.com-watch-list

1. `yarn`

1. add `{projectRoot}/credential.json` for your account credential

1. `yarn start`

## Filmarks watched importer

- `yarn filmarks:watch -- --dry-run --limit=5`
- Arguments (all optional):
  - `--chrome-path` path to Google Chrome executable (defaults to `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`)
  - `--titles-path` JSON file to read watched titles from (defaults to `export/check-in-watched.json`)
  - `--credentials-path` credentials JSON file (defaults to `credential.json`)
  - `--limit` limit how many titles to process
  - `--dry-run` (または `--dry-run=true`) でクリックせずログのみ。既定は `false`

`credential.json` には Filmarks の `email`, `password` を含めてください（既存の `userId` フィールドがあっても構いません）。スクリプトは Filmarks にログインしたあと、作品を 1 件ずつ開き、詳細ページで 8 秒待機してから「鑑賞済み」/「観た」ボタンを押します。

##

Here is sample of `credential.json`.
  ```json
    {
      "userId": "123456",
      "email": "foo@gmail.com",
      "password": "fooBarBuz"
    }
  ```
