# Resolver Mixed Content (API em HTTP bloqueada em página HTTPS)

O erro *"requested an insecure XMLHttpRequest endpoint 'http://helenamelosolicitadora.com/api/...'"* aparece porque o **browser está a carregar JavaScript ou HTML antigos**. O código no repositório já está correto; é preciso garantir que **o servidor na VPS sirva a nova build**.

---

## 1. Confirmar se o servidor está a servir ficheiros novos

1. Abre **https://helenamelosolicitadora.com**
2. Clica com o botão direito → **Ver código-fonte da página** (ou Ctrl+U)
3. No código-fonte, procura por: **`VERSAO-HTTPS-FIX`**

- **Se aparecer** → O servidor está a servir o `index.html` novo. Se o erro continuar, faz um **hard refresh** (Ctrl+Shift+R) ou testa em **janela anónima** para limpar cache do JS.
- **Se NÃO aparecer** → O servidor está a servir um **index.html antigo**. Tens de fazer deploy da pasta **`dist/`** desta build (ver secção 2).

---

## 2. Fazer deploy da nova build (obrigatório)

### A) Build local

No teu PC (na pasta do projeto):

```bash
cd frontend_app_soli
npm install
npm run build
```

Isto gera a pasta **`dist/`** com `index.html` e ficheiros em `assets/`.

### B) Enviar para a VPS

**Se usas Docker:**

1. A nova build tem de estar **dentro da imagem** que corre na VPS.
2. Na pasta do projeto (onde está o Dockerfile do frontend ou o docker-compose):

   ```bash
   docker compose build vite_frontend --no-cache
   docker compose up -d vite_frontend
   ```

   (Ajusta `vite_frontend` ao nome do serviço do frontend no teu `docker-compose`.)

3. Se o frontend for servido por um **nginx** à frente, reinicia também o nginx se for preciso.

**Se copias ficheiros à mão (sem Docker):**

1. Na VPS, vai à pasta onde o nginx (ou outro) serve o frontend (ex.: `/var/www/app/` ou o que tiveres).
2. Faz **backup** dessa pasta se quiseres.
3. Copia **todo** o conteúdo de **`dist/`** do teu PC para essa pasta (substituindo o que lá está).
4. Garante que o **`index.html`** está na raiz dessa pasta e que os ficheiros em `assets/` estão na pasta `assets/`.

### C) Cache e CDN

- Se usas **Cloudflare** (ou outro CDN), faz **purge** da cache para o domínio.
- No **nginx**, podes desativar cache para o HTML (opcional):

  ```nginx
  location = /index.html {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
  }
  ```

Depois de fazer isto, volta a **Ver código-fonte** e confirma que **`VERSAO-HTTPS-FIX`** aparece.

---

## 3. O que o código faz (para referência)

- **index.html** – Um script no `<head>` corre antes do React e:
  - Define `<base href="https://...">` quando a página está em HTTPS.
  - Altera **XMLHttpRequest** e **fetch** para que qualquer pedido a `http://helenamelosolicitadora.com` ou com path relativo (ex.: `/api/clientes`) passe a ser feito para **https://helenamelosolicitadora.com/...**.

- **api.ts** – O axios usa um interceptor que monta o URL completo com `window.location.origin + '/api/' + path`, para que a API use sempre o mesmo esquema (HTTPS) da página.

Se o **index.html** servido for o novo, o script no `<head>` já resolve o Mixed Content mesmo que o bundle JS esteja em cache. Por isso o passo crítico é **servir o novo `index.html`** na VPS.

---

## 4. Resumo

| O que fazer | Comando / acção |
|-------------|------------------|
| Build | `cd frontend_app_soli && npm run build` |
| Deploy (Docker) | Reconstruir imagem do frontend e fazer `up -d` |
| Deploy (manual) | Copiar todo o conteúdo de `dist/` para a pasta que o nginx serve |
| Verificar | Ver código-fonte do site e procurar `VERSAO-HTTPS-FIX` |
| Cache | Hard refresh (Ctrl+Shift+R) ou janela anónima; purge CDN se usares |

Se depois disto o erro continuar, envia o resultado de **Ver código-fonte** (primeiras 30 linhas) do site em produção para confirmar se o `index.html` servido é o novo.
