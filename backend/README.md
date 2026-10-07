# Guia Norte - Backend

1. Instale as dependências:
   npm install

2. Copie o arquivo .env.example para .env e preencha MONGO_URI e JWT_SECRET:
   Windows (PowerShell): copy .env.example .env
   Mac/Linux:            cp .env.example .env

3. Rode o servidor:
   npm run dev

4. Abra http://localhost:3000 - deve aparecer {"ok":true,"app":"Guia Norte API"}
