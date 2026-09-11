// ============================================================
// AUTH.JS
// Autenticação, cadastro, login, recuperação de senha
// Firebase Authentication + Firestore
// Firebase 12.18.0
// ============================================================

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    onAuthStateChanged,
    updateProfile,
    deleteUser,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { app } from "./firebase-config.js";


// ============================================================
// FIREBASE
// ============================================================

const auth = getAuth(app);
const db = getFirestore(app);


// ============================================================
// GARANTIR PERFIL DO CLIENTE
// ============================================================
//
// Usuários que já existem no Firebase Authentication, mas ficaram
// sem documento em /clientes/{uid}, continuam podendo entrar.
// Nesse caso criamos um perfil mínimo com os campos exigidos pelas
// regras do Firestore.
// ============================================================

async function ensureClientProfile(user) {

    if (!user?.uid || !user?.email) {
        return;
    }

    const clientRef = doc(
        db,
        "clientes",
        user.uid
    );

    const snapshot = await getDoc(clientRef);

    if (snapshot.exists()) {
        return;
    }

    await setDoc(clientRef, {
        uid: user.uid,
        nome: user.displayName || "",
        cpf: "",
        dataNascimento: "",
        email: user.email,
        telefone: "",
        whatsapp: "",
        cep: "",
        endereco: {},
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        referencia: "",
        status: "ativo",
        tipoUsuario: "cliente",
        aceitaTermos: false,
        aceitaPrivacidade: false,
        aceitaMarketing: false,
        dataCadastro: serverTimestamp()
    });
}


// ============================================================
// ADMINISTRADOR PROTEGIDO
// ============================================================

const PROTECTED_ADMIN_EMAIL =
    "soluxtecnologia19@gmail.com";


// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function normalizeEmail(value) {

    return String(value || "")
        .trim()
        .toLowerCase();

}


// ============================================================
// MENSAGENS DE ERRO DO FIREBASE
// ============================================================

function getFirebaseErrorMessage(error) {

    if (!error) {

        return "Ocorreu um erro desconhecido.";

    }


    switch (error.code) {

        case "auth/email-already-in-use":

            return (
                "Este e-mail já está cadastrado no Firebase Authentication. " +
                "Se ele pertencia a uma conta excluída, a conta antiga " +
                "precisa ser removida do Firebase Authentication antes " +
                "que o mesmo e-mail possa ser cadastrado novamente."
            );


        case "auth/invalid-email":

            return "Digite um e-mail válido.";


        case "auth/weak-password":

            return "A senha é muito fraca. Escolha uma senha mais segura.";


        case "auth/passwords-do-not-match":

            return "As senhas não são iguais.";


        case "auth/user-not-found":

            return "E-mail ou senha incorretos.";


        case "auth/wrong-password":

            return "E-mail ou senha incorretos.";


        case "auth/invalid-credential":

            return "E-mail ou senha incorretos.";


        case "auth/user-disabled":

            return "Esta conta foi desativada.";


        case "auth/too-many-requests":

            return (
                "Muitas tentativas foram realizadas. " +
                "Aguarde alguns minutos e tente novamente."
            );


        case "auth/network-request-failed":

            return (
                "Não foi possível conectar ao Firebase. " +
                "Verifique sua internet e tente novamente."
            );


        case "auth/requires-recent-login":

            return (
                "Por segurança, é necessário entrar novamente na conta " +
                "antes de realizar esta operação."
            );


        case "permission-denied":
        case "firestore/permission-denied":

            return (
                "O Firebase recusou esta operação. " +
                "Verifique as regras de segurança do Firestore."
            );


        default:

            console.error(
                "Erro Firebase:",
                error
            );

            return (
                error.message ||
                "Ocorreu um erro ao processar a operação."
            );

    }

}


// ============================================================
// FORMATAÇÃO CPF
// ============================================================

function formatCPF(value) {

    let cpf =
        String(value || "")
            .replace(/\D/g, "")
            .slice(0, 11);


    if (cpf.length > 9) {

        return cpf.replace(
            /(\d{3})(\d{3})(\d{3})(\d{1,2})/,
            "$1.$2.$3-$4"
        );

    }


    if (cpf.length > 6) {

        return cpf.replace(
            /(\d{3})(\d{3})(\d{1,3})/,
            "$1.$2.$3"
        );

    }


    if (cpf.length > 3) {

        return cpf.replace(
            /(\d{3})(\d{1,3})/,
            "$1.$2"
        );

    }


    return cpf;

}


// ============================================================
// FORMATAÇÃO TELEFONE
// ============================================================

function formatPhone(value) {

    let phone =
        String(value || "")
            .replace(/\D/g, "")
            .slice(0, 11);


    if (phone.length > 10) {

        return phone.replace(
            /(\d{2})(\d{5})(\d{4})/,
            "($1) $2-$3"
        );

    }


    if (phone.length > 6) {

        return phone.replace(
            /(\d{2})(\d{4})(\d{1,4})/,
            "($1) $2-$3"
        );

    }


    if (phone.length > 2) {

        return phone.replace(
            /(\d{2})(\d{1,5})/,
            "($1) $2"
        );

    }


    return phone;

}


// ============================================================
// FORMATAÇÃO CEP
// ============================================================

function formatCEP(value) {

    let cep =
        String(value || "")
            .replace(/\D/g, "")
            .slice(0, 8);


    if (cep.length > 5) {

        return cep.replace(
            /(\d{5})(\d{1,3})/,
            "$1-$2"
        );

    }


    return cep;

}


// ============================================================
// VALIDAÇÃO CPF
// ============================================================

function isValidCPF(value) {

    const cpf =
        String(value || "")
            .replace(/\D/g, "");


    if (cpf.length !== 11) {

        return false;

    }


    if (/^(\d)\1{10}$/.test(cpf)) {

        return false;

    }


    let sum = 0;


    for (let i = 0; i < 9; i++) {

        sum +=
            Number(cpf.charAt(i)) *
            (10 - i);

    }


    let remainder =
        (sum * 10) % 11;


    if (remainder === 10) {

        remainder = 0;

    }


    if (
        remainder !==
        Number(cpf.charAt(9))
    ) {

        return false;

    }


    sum = 0;


    for (let i = 0; i < 10; i++) {

        sum +=
            Number(cpf.charAt(i)) *
            (11 - i);

    }


    remainder =
        (sum * 10) % 11;


    if (remainder === 10) {

        remainder = 0;

    }


    return (
        remainder ===
        Number(cpf.charAt(10))
    );

}


// ============================================================
// VALIDAÇÃO DATA
// ============================================================

function isValidBirthDate(value) {

    if (!value) {

        return false;

    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return false;

    }


    const today =
        new Date();


    if (date > today) {

        return false;

    }


    const minimumDate =
        new Date();


    minimumDate.setFullYear(
        minimumDate.getFullYear() - 120
    );


    if (date < minimumDate) {

        return false;

    }


    return true;

}


// ============================================================
// VALIDAÇÃO TELEFONE
// ============================================================

function isValidPhone(value) {

    const phone =
        String(value || "")
            .replace(/\D/g, "");


    return (
        phone.length >= 10 &&
        phone.length <= 11
    );

}


// ============================================================
// VALIDAÇÃO CEP
// ============================================================

function isValidCEP(value) {

    const cep =
        String(value || "")
            .replace(/\D/g, "");


    return cep.length === 8;

}


// ============================================================
// VIA CEP
// ============================================================

async function buscarCEP(cep) {

    const cleanCEP =
        String(cep || "")
            .replace(/\D/g, "");


    if (
        cleanCEP.length !== 8
    ) {

        return null;

    }


    const response =
        await fetch(
            `https://viacep.com.br/ws/${cleanCEP}/json/`
        );


    if (!response.ok) {

        throw new Error(
            "Não foi possível consultar o CEP."
        );

    }


    const data =
        await response.json();


    if (data.erro) {

        throw new Error(
            "CEP não encontrado."
        );

    }


    return data;

}


// ============================================================
// ELEMENTOS DO CADASTRO
// ============================================================

const formCadastro =
    document.getElementById("cadastroForm") ||
    document.getElementById("registerForm");


// ============================================================
// MENSAGEM DO CADASTRO
// ============================================================

function mostrarMensagemCadastro(
    mensagem,
    tipo = "erro"
) {

    const elemento =
        document.getElementById("cadastroMessage") ||
        document.getElementById("registerMessage") ||
        document.getElementById("mensagem");


    if (!elemento) {

        console.log(mensagem);

        return;

    }


    elemento.textContent =
        mensagem;


    elemento.className =
        tipo === "sucesso"
            ? "message success"
            : "message error";

}


// ============================================================
// CADASTRO
// ============================================================

if (formCadastro) {

    const nomeInput =
        document.getElementById("nome");


    const cpfInput =
        document.getElementById("cpf");


    const dataNascimentoInput =
        document.getElementById("dataNascimento");


    const telefoneInput =
        document.getElementById("telefone");


    const whatsappInput =
        document.getElementById("whatsapp");


    const emailInput =
        document.getElementById("email");


    const senhaInput =
        document.getElementById("senha");


    const confirmarSenhaInput =
        document.getElementById("confirmarSenha");


    const cepInput =
        document.getElementById("cep");


    const enderecoInput =
        document.getElementById("endereco");


    const numeroInput =
        document.getElementById("numero");


    const complementoInput =
        document.getElementById("complemento");


    const bairroInput =
        document.getElementById("bairro");


    const cidadeInput =
        document.getElementById("cidade");


    const estadoInput =
        document.getElementById("estado");


    const referenciaInput =
        document.getElementById("referencia");


    const termosInput =
        document.getElementById("termos");


    const privacidadeInput =
        document.getElementById("privacidade");


    const marketingInput =
        document.getElementById("marketing");


    // ========================================================
    // MÁSCARAS
    // ========================================================

    if (cpfInput) {

        cpfInput.addEventListener(
            "input",
            () => {

                cpfInput.value =
                    formatCPF(
                        cpfInput.value
                    );

            }
        );

    }


    if (telefoneInput) {

        telefoneInput.addEventListener(
            "input",
            () => {

                telefoneInput.value =
                    formatPhone(
                        telefoneInput.value
                    );

            }
        );

    }


    if (whatsappInput) {

        whatsappInput.addEventListener(
            "input",
            () => {

                whatsappInput.value =
                    formatPhone(
                        whatsappInput.value
                    );

            }
        );

    }


    if (cepInput) {

        cepInput.addEventListener(
            "input",
            () => {

                cepInput.value =
                    formatCEP(
                        cepInput.value
                    );

            }
        );


        cepInput.addEventListener(
            "blur",
            async () => {

                const cep =
                    cepInput.value
                        .replace(/\D/g, "");


                if (
                    cep.length !== 8
                ) {

                    return;

                }


                try {

                    const endereco =
                        await buscarCEP(
                            cep
                        );


                    if (enderecoInput) {

                        enderecoInput.value =
                            endereco.logradouro ||
                            "";

                    }


                    if (bairroInput) {

                        bairroInput.value =
                            endereco.bairro ||
                            "";

                    }


                    if (cidadeInput) {

                        cidadeInput.value =
                            endereco.localidade ||
                            "";

                    }


                    if (estadoInput) {

                        estadoInput.value =
                            endereco.uf ||
                            "";

                    }


                    if (numeroInput) {

                        numeroInput.focus();

                    }

                } catch (error) {

                    console.error(
                        "Erro ao consultar CEP:",
                        error
                    );

                }

            }
        );

    }


    // ========================================================
    // SUBMIT
    // ========================================================

    formCadastro.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            mostrarMensagemCadastro(
                "",
                "erro"
            );


            // ==================================================
            // DADOS
            // ==================================================

            const nome =
                nomeInput?.value.trim() ||
                "";


            const cpf =
                cpfInput?.value.trim() ||
                "";


            const dataNascimento =
                dataNascimentoInput?.value ||
                "";


            const telefone =
                telefoneInput?.value.trim() ||
                "";


            const whatsapp =
                whatsappInput?.value.trim() ||
                "";


            const email =
                normalizeEmail(
                    emailInput?.value
                );


            const senha =
                senhaInput?.value ||
                "";


            const confirmarSenha =
                confirmarSenhaInput?.value ||
                "";


            const cep =
                cepInput?.value.trim() ||
                "";


            const endereco =
                enderecoInput?.value.trim() ||
                "";


            const numero =
                numeroInput?.value.trim() ||
                "";


            const complemento =
                complementoInput?.value.trim() ||
                "";


            const bairro =
                bairroInput?.value.trim() ||
                "";


            const cidade =
                cidadeInput?.value.trim() ||
                "";


            const estado =
                estadoInput?.value
                    .trim()
                    .toUpperCase() ||
                "";


            const referencia =
                referenciaInput?.value.trim() ||
                "";


            const aceitaTermos =
                Boolean(
                    termosInput?.checked
                );


            const aceitaPrivacidade =
                Boolean(
                    privacidadeInput?.checked
                );


            const aceitaMarketing =
                Boolean(
                    marketingInput?.checked
                );


            // ==================================================
            // VALIDAÇÕES
            // ==================================================

            if (!nome) {

                mostrarMensagemCadastro(
                    "Informe seu nome completo."
                );

                nomeInput?.focus();

                return;

            }


            if (
                !cpf ||
                !isValidCPF(cpf)
            ) {

                mostrarMensagemCadastro(
                    "Informe um CPF válido."
                );

                cpfInput?.focus();

                return;

            }


            if (
                dataNascimento &&
                !isValidBirthDate(
                    dataNascimento
                )
            ) {

                mostrarMensagemCadastro(
                    "Informe uma data de nascimento válida."
                );

                dataNascimentoInput?.focus();

                return;

            }


            if (!email) {

                mostrarMensagemCadastro(
                    "Informe seu e-mail."
                );

                emailInput?.focus();

                return;

            }


            if (
                !telefone ||
                !isValidPhone(telefone)
            ) {

                mostrarMensagemCadastro(
                    "Informe um telefone válido."
                );

                telefoneInput?.focus();

                return;

            }


            if (
                whatsapp &&
                !isValidPhone(whatsapp)
            ) {

                mostrarMensagemCadastro(
                    "Informe um WhatsApp válido."
                );

                whatsappInput?.focus();

                return;

            }


            if (
                !cep ||
                !isValidCEP(cep)
            ) {

                mostrarMensagemCadastro(
                    "Informe um CEP válido."
                );

                cepInput?.focus();

                return;

            }


            if (!endereco) {

                mostrarMensagemCadastro(
                    "Informe seu endereço."
                );

                enderecoInput?.focus();

                return;

            }


            if (!numero) {

                mostrarMensagemCadastro(
                    "Informe o número do endereço."
                );

                numeroInput?.focus();

                return;

            }


            if (!bairro) {

                mostrarMensagemCadastro(
                    "Informe seu bairro."
                );

                bairroInput?.focus();

                return;

            }


            if (!cidade) {

                mostrarMensagemCadastro(
                    "Informe sua cidade."
                );

                cidadeInput?.focus();

                return;

            }


            if (
                !estado ||
                estado.length !== 2
            ) {

                mostrarMensagemCadastro(
                    "Informe o estado corretamente."
                );

                estadoInput?.focus();

                return;

            }


            if (
                senha.length < 6
            ) {

                mostrarMensagemCadastro(
                    "A senha precisa ter pelo menos 6 caracteres."
                );

                senhaInput?.focus();

                return;

            }


            if (
                senha !== confirmarSenha
            ) {

                mostrarMensagemCadastro(
                    "As senhas não são iguais."
                );

                confirmarSenhaInput?.focus();

                return;

            }


            if (!aceitaTermos) {

                mostrarMensagemCadastro(
                    "Você precisa aceitar os termos de uso."
                );

                termosInput?.focus();

                return;

            }


            if (!aceitaPrivacidade) {

                mostrarMensagemCadastro(
                    "Você precisa aceitar a política de privacidade."
                );

                privacidadeInput?.focus();

                return;

            }


            // ==================================================
            // BOTÃO
            // ==================================================

            const submitButton =
                formCadastro.querySelector(
                    'button[type="submit"], input[type="submit"]'
                );


            const textoOriginal =
                submitButton?.textContent ||
                "";


            if (submitButton) {

                submitButton.disabled =
                    true;


                if (
                    submitButton.tagName ===
                    "BUTTON"
                ) {

                    submitButton.textContent =
                        "Criando conta...";

                }

            }


            try {

                // ==============================================
                // CRIA USUÁRIO NO FIREBASE AUTHENTICATION
                // ==============================================

                const credential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        senha
                    );


                const user =
                    credential.user;


                // ==============================================
                // NOME DO USUÁRIO
                // ==============================================

                await updateProfile(
                    user,
                    {
                        displayName:
                            nome
                    }
                );


                // ==============================================
                // FIRESTORE
                // ==============================================

                try {

                    await setDoc(
                        doc(
                            db,
                            "clientes",
                            user.uid
                        ),
                        {

                            uid:
                                user.uid,

                            nome:
                                nome,

                            cpf:
                                cpf,

                            dataNascimento:
                                dataNascimento,

                            email:
                                email,

                            telefone:
                                telefone,

                            whatsapp:
                                whatsapp,

                            cep:
                                cep,

                            endereco:
                                endereco,

                            numero:
                                numero,

                            complemento:
                                complemento,

                            bairro:
                                bairro,

                            cidade:
                                cidade,

                            estado:
                                estado,

                            referencia:
                                referencia,

                            status:
                                "ativo",

                            tipoUsuario:
                                "cliente",

                            aceitaTermos:
                                aceitaTermos,

                            aceitaPrivacidade:
                                aceitaPrivacidade,

                            aceitaMarketing:
                                aceitaMarketing,

                            dataCadastro:
                                serverTimestamp()

                        }
                    );


                } catch (firestoreError) {

                    // ==========================================
                    // LIMPEZA DA CONTA RECÉM-CRIADA
                    // ==========================================
                    //
                    // Se o Firestore recusar a gravação,
                    // tentamos apagar SOMENTE a conta criada
                    // nesta tentativa.
                    //
                    // Nunca procura nem apaga contas antigas.
                    // Nunca apaga o administrador.
                    // ==========================================

                    try {

                        if (
                            normalizeEmail(
                                user.email
                            ) !==
                            PROTECTED_ADMIN_EMAIL
                        ) {

                            await deleteUser(
                                user
                            );

                        }

                    } catch (cleanupError) {

                        console.error(
                            "Não foi possível desfazer a conta Authentication criada:",
                            cleanupError
                        );

                    }


                    throw firestoreError;

                }


                // ==============================================
                // ENVIA E-MAIL DE VERIFICAÇÃO
                // ==============================================

                try {

                    await sendEmailVerification(
                        user
                    );

                } catch (
                    verificationError
                ) {

                    console.error(
                        "Não foi possível enviar o e-mail de verificação:",
                        verificationError
                    );

                }


                // ==============================================
                // SUCESSO
                // ==============================================

                mostrarMensagemCadastro(
                    "Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.",
                    "sucesso"
                );


                // ==============================================
                // LIMPA O FORMULÁRIO
                // ==============================================

                formCadastro.reset();


                // ==============================================
                // REDIRECIONAMENTO
                // ==============================================

                setTimeout(
                    () => {

                        window.location.href =
                            "login.html";

                    },
                    2500
                );


            } catch (error) {

                console.error(
                    "Erro no cadastro:",
                    error
                );


                mostrarMensagemCadastro(
                    getFirebaseErrorMessage(
                        error
                    ),
                    "erro"
                );


            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;


                    if (
                        submitButton.tagName ===
                        "BUTTON"
                    ) {

                        submitButton.textContent =
                            textoOriginal ||
                            "Criar conta";

                    }

                }

            }

        }
    );

}


// ============================================================
// LOGIN
// ============================================================

const formLogin =
    document.getElementById("loginForm") ||
    document.getElementById("formLogin");


if (formLogin) {

    formLogin.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const emailInput =
                document.getElementById(
                    "email"
                );


            const senhaInput =
                document.getElementById(
                    "senha"
                );


            const email =
                normalizeEmail(
                    emailInput?.value
                );


            const senha =
                senhaInput?.value ||
                "";


            const message =
                document.getElementById(
                    "loginMessage"
                ) ||
                document.getElementById(
                    "mensagem"
                );


            function showLoginMessage(
                text,
                type = "erro"
            ) {

                if (!message) {

                    console.log(text);

                    return;

                }


                message.textContent =
                    text;


                message.className =
                    type === "sucesso"
                        ? "message success"
                        : "message error";

            }


            if (!email) {

                showLoginMessage(
                    "Informe seu e-mail."
                );

                emailInput?.focus();

                return;

            }


            if (!senha) {

                showLoginMessage(
                    "Informe sua senha."
                );

                senhaInput?.focus();

                return;

            }


            const lembrar =
                document.getElementById(
                    "lembrar"
                )?.checked ||

                document.getElementById(
                    "remember"
                )?.checked ||

                false;


            try {

                // ==============================================
                // PERSISTÊNCIA
                // ==============================================

                await setPersistence(
                    auth,
                    lembrar
                        ? browserLocalPersistence
                        : browserSessionPersistence
                );


                // ==============================================
                // LOGIN
                // ==============================================

                const credential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        senha
                    );


                const user =
                    credential.user;


                // ==============================================
                // VERIFICAÇÃO DO ADMINISTRADOR
                // ==============================================
                //
                // O administrador NÃO vai para cliente.html.
                //
                // O acesso administrativo depende do Custom
                // Claim "admin === true" configurado no Firebase.
                // ==============================================

                await user.getIdToken(
                    true
                );


                const tokenResult =
                    await user.getIdTokenResult();


                const isAdmin =
                    tokenResult.claims.admin ===
                    true;


                if (isAdmin) {

                    showLoginMessage(
                        "Login administrativo realizado com sucesso!",
                        "sucesso"
                    );


                    setTimeout(
                        () => {

                            window.location.href =
                                "admin.html";

                        },
                        500
                    );


                    return;

                }


                // ==============================================
                // PERFIL DO CLIENTE
                // ==============================================
                //
                // Garante que contas antigas do Authentication que
                // não possuem documento em /clientes/{uid} também
                // consigam entrar na área do cliente.
                // ==============================================

                await ensureClientProfile(user);


                // ==============================================
                // SUCESSO DO CLIENTE
                // ==============================================
                //
                // O cliente pode acessar a conta mesmo que ainda
                // não tenha confirmado o e-mail.
                //
                // A confirmação continua sendo enviada no cadastro,
                // mas não bloqueia o login.
                // ==============================================

                showLoginMessage(
                    "Login realizado com sucesso!",
                    "sucesso"
                );


                setTimeout(
                    () => {

                        window.location.href =
                            "cliente.html";

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "Erro no login:",
                    error
                );


                showLoginMessage(
                    getFirebaseErrorMessage(
                        error
                    )
                );

            }

        }
    );

}


// ============================================================
// RECUPERAÇÃO DE SENHA
// ============================================================

const forgotPassword =
    document.getElementById(
        "forgotPassword"
    ) ||
    document.getElementById(
        "esqueciSenha"
    );


if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        async (event) => {

            event.preventDefault();


            const emailInput =
                document.getElementById(
                    "email"
                );


            const email =
                normalizeEmail(
                    emailInput?.value
                );


            const message =
                document.getElementById(
                    "loginMessage"
                ) ||
                document.getElementById(
                    "mensagem"
                );


            if (!email) {

                if (message) {

                    message.textContent =
                        "Digite seu e-mail para receber o link de recuperação.";


                    message.className =
                        "message error";

                }


                emailInput?.focus();

                return;

            }


            try {

                await sendPasswordResetEmail(
                    auth,
                    email
                );


                if (message) {

                    message.textContent =
                        "Enviamos um link de recuperação para seu e-mail.";


                    message.className =
                        "message success";

                }


            } catch (error) {

                console.error(
                    "Erro ao recuperar senha:",
                    error
                );


                if (message) {

                    message.textContent =
                        getFirebaseErrorMessage(
                            error
                        );


                    message.className =
                        "message error";

                }

            }

        }
    );

}


// ============================================================
// LOGOUT GLOBAL
// ============================================================

const logoutButtons =
    document.querySelectorAll(
        "[data-logout], #logoutButton, #btnLogout, #sair"
    );


logoutButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            async () => {

                try {

                    await signOut(
                        auth
                    );


                    window.location.href =
                        "login.html";


                } catch (error) {

                    console.error(
                        "Erro ao sair:",
                        error
                    );

                }

            }
        );

    }
);


// ============================================================
// OBSERVADOR DE AUTENTICAÇÃO
// ============================================================

onAuthStateChanged(
    auth,
    (user) => {

        window.firebaseUsuarioAtual =
            user || null;

    }
);


// ============================================================
// EXPORTAÇÕES GLOBAIS
// ============================================================

window.firebaseAuth =
    auth;


window.firebaseDb =
    db;


window.firebaseSignOut =
    async function () {

        await signOut(
            auth
        );


        window.location.href =
            "login.html";

    };


// ============================================================
// FIM DO AUTH.JS
// ============================================================
