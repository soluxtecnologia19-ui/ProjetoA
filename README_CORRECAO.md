# CasaFort — projeto corrigido

### O que foi corrigido
1. O cliente não é bloqueado por `emailVerified` ao entrar.
2. Contas que existem no Firebase Authentication, mas não possuem `clientes/{uid}`, recebem um perfil mínimo automaticamente após o login.
3. O acesso ao administrador continua dependendo exclusivamente do Custom Claim `admin === true`.
4. O cliente continua obrigado a confirmar o e-mail para finalizar a compra, conforme a regra já existente em `finalizarCompra()`.
5. A regra de atualização de clientes permite ao próprio cliente alterar somente `nome`, `telefone` e `endereco`.

### Publicação
Publique `firestore.rules` no mesmo projeto Firebase indicado em `js/firebase-config.js`.

O ZIP não publica as regras no Firebase automaticamente.
