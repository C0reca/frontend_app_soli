# Resolver Mixed Content (API em HTTPS)

Se o site em **https://helenamelosolicitadora.com** continua a dar erro  
*"requested an insecure XMLHttpRequest endpoint 'http://helenamelosolicitadora.com/api/...'"*,  
o browser está a usar **JavaScript antigo**. O código atual **reescreve cada pedido** para o URL completo em `https://` quando a página está em HTTPS; para ter efeito, é **obrigatório** fazer **rebuild e redeploy** do frontend.

## Passos obrigatórios

### 1. Rebuild do frontend (local ou CI)

```bash
cd frontend_app_soli
npm ci
npm run build
```

Deve gerar a pasta **`dist/`** com os ficheiros novos.

### 2. Enviar a nova build para a VPS

- Copiar o conteúdo de **`dist/`** para o sítio onde o nginx/servidor serve o frontend, **ou**
- Reconstruir a imagem Docker do frontend e fazer deploy da nova imagem.

Exemplo com Docker (ajuste aos seus nomes):

```bash
docker build -t app-frontend ./frontend_app_soli
docker compose up -d vite_frontend
```

### 3. Limpar cache no browser

Depois do deploy:

- **Hard refresh:** Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac), **ou**
- Abrir o site em **janela anónima/privada**.

### 4. Confirmar que o fix está ativo

1. Abrir https://helenamelosolicitadora.com/clientes  
2. F12 → separador **Rede (Network)**  
3. Recarregar a página  
4. Clicar no pedido a `clientes` ou `clientes/`  
5. Ver o **URL do pedido:** deve ser **https://**helenamelosolicitadora.com/api/clientes/  
   - Se ainda for **http://**, o browser está a usar JS em cache ou o servidor ainda não está a servir a nova build.

---

## O que o código faz

Em **`src/services/api.ts`** um interceptor de pedidos chama **`ensureHttpsUrl(config)`** em cada request:

- Se a página estiver em **HTTPS**, o `config.url` é substituído pelo URL absoluto `https://<host>/api/...` (ex.: `https://helenamelosolicitadora.com/api/clientes/`).
- Assim, todos os pedidos (clientes, processos, IRS, calendário, tarefas, etc.) usam **HTTPS** e o aviso de Mixed Content deixa de aparecer.

O fix só tem efeito quando o **JavaScript servido ao browser** for o que contém este código. Daí ser essencial **rebuild + redeploy + limpar cache**.
