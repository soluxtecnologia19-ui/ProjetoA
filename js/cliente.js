/* ============================================================
   CLIENTE.JS
   LOJA / VITRINE / FAVORITOS / CARRINHO / PEDIDOS / PERFIL

   Compatível com:
   - cliente.html novo
   - Firebase 12.18.0
   - js/firebase-config.js
   - js/auth.js

   IMPORTANTE:
   Este é o ÚNICO arquivo responsável pela lógica da área
   do cliente.

   Não colocar outro script da loja dentro do cliente.html.
   ============================================================ */


/* ============================================================
   FIREBASE
   ============================================================ */

import {
    onAuthStateChanged,
    signOut,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    addDoc,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    auth,
    db
} from "./firebase-config.js";


/* ============================================================
   CONFIGURAÇÕES
   ============================================================ */

const PROTECTED_ADMIN_EMAIL =
    "soluxtecnologia19@gmail.com";


const PRODUCTS_COLLECTION =
    "produtos";


const CLIENTS_COLLECTION =
    "clientes";


const ORDERS_COLLECTION =
    "pedidos";


/* ============================================================
   ESTADO DA APLICAÇÃO
   ============================================================ */

let currentUser = null;

let currentClientData = {};

let allProducts = [];

let categories = [];
let selectedCategoryId = "";

let filteredProducts = [];

let favorites = [];

let cart = [];

let currentProduct = null;

let currentProductImages = [];

let currentProductImageIndex = 0;

/* Controla o histórico do detalhe para que o botão "Voltar"
   e o botão voltar do navegador retornem à página anterior. */
let productModalHistoryActive = false;
let closingProductModalFromHistory = false;

let currentDetailQuantity = 1;

let isSavingCart = false;

let isSavingFavorite = false;

let isDeletingAccount = false;

let unsubscribePlaceholder = null;

/* ============================================================
   FRETE / ENTREGA
   ============================================================ */

const DELIVERY_DOCUMENT_PATH = [
    "configuracoes",
    "entrega"
];

let deliverySettings = null;
let deliveryCost = null;
let deliveryCep = "";
let deliveryCalculated = false;


/* ============================================================
   REFERÊNCIAS DOM
   ============================================================ */

const $ = id =>
    document.getElementById(id);


/* Vitrine */

const productsGrid =
    $("productsGrid");
const sponsoredProductsGrid =
    $("sponsoredProductsGrid");

const mostViewedProductsGrid =
    $("mostViewedProductsGrid");
const youMayLikeProductsGrid = $("youMayLikeProductsGrid");
const bestSellingProductsGrid = $("bestSellingProductsGrid");
const offersProductsGrid = $("offersProductsGrid");
const offersButton = $("offersButton");
const offersSection = $("offersSection");
const offersBackButton = $("offersBackButton");
const categoryStripTrack = $("categoryStripTrack");
const categoryStripPrev = $("categoryStripPrev");
const categoryStripNext = $("categoryStripNext");
const siteFooter = $("siteFooter");
const productSearch =
    $("productSearch");

const searchClear =
    $("searchClear");

const storeSection =
    $("storeSection");


/* Navegação */

const favoritesButton =
    $("favoritesButton");

const accountButton =
    $("accountButton");

const cartButton =
    $("cartButton");

const logoutButton =
    $("logoutButton");


/* Menu mobile */

const mobileMenuButton =
    $("mobileMenuButton");

const mobileMenuDropdown =
    $("mobileMenuDropdown");

/* Categorias dinâmicas */
const categoryMenu =
    $("categoryMenu");

/* Publicidade / Marketink */
const advertising1Section =
    $("advertising1Section");

const advertising1Track =
    $("advertising1Track");

const advertising2Section =
    $("advertising2Section");

const advertising2Track =
    $("advertising2Track");


/* Seções */

const favoritesSection =
    $("favoritesSection");

const profileSection =
    $("profileSection");

const ordersSection =
    $("ordersSection");


const favoritesGrid =
    $("favoritesGrid");


const ordersList =
    $("ordersList");


/* Voltar */

const backToStoreFromFavorites =
    $("backToStoreFromFavorites");

const backToStoreFromProfile =
    $("backToStoreFromProfile");

const backToStoreFromOrders =
    $("backToStoreFromOrders");


/* Carrinho */

const cartDrawer =
    $("cartDrawer");

const cartOverlay =
    $("cartOverlay");

const closeCartButton =
    $("closeCartButton");

const cartItems =
    $("cartItems");

const cartCount =
    $("cartCount");

const cartTotal =
    $("cartTotal");

const checkoutButton =
    $("checkoutButton");

const checkoutMessage =
    $("checkoutMessage");

const cartSubtotal =
    $("cartSubtotal");

const cartDeliveryCep =
    $("cartDeliveryCep");

const calculateDeliveryButton =
    $("calculateDeliveryButton");

const cartDeliveryCost =
    $("cartDeliveryCost");

const cartDeliveryMessage =
    $("cartDeliveryMessage");


/* Produto */

const productModal =
    $("productModal");

const closeProductModal =
    $("closeProductModal");

const detailMainImage =
    $("detailMainImage");

const detailThumbs =
    $("detailThumbs");

const detailTitle =
    $("detailTitle");

const detailCode =
    $("detailCode");

const detailRating =
    $("detailRating");

const detailOffer =
    $("detailOffer");

const detailOldPrice =
    $("detailOldPrice");

const detailPrice =
    $("detailPrice");

const detailInstallments =
    $("detailInstallments");

const detailDescription =
    $("detailDescription");

const detailStock =
    $("detailStock");

const detailQuantity =
    $("detailQuantity");

const detailQuantityMinus =
    $("detailQuantityMinus");

const detailQuantityPlus =
    $("detailQuantityPlus");

const detailAddButton =
    $("detailAddButton");

const detailMessage =
    $("detailMessage");

const relatedProductsSection =
    $("relatedProductsSection");

const relatedProductsTrack =
    $("relatedProductsTrack");

const relatedProductsPrev =
    $("relatedProductsPrev");

const relatedProductsNext =
    $("relatedProductsNext");


/* Perfil */

const profileNome =
    $("profileNome");

const profileEmail =
    $("profileEmail");

const profileCpf =
    $("profileCpf");

const profileNascimento =
    $("profileNascimento");

const profileTelefone =
    $("profileTelefone");

const profileWhatsapp =
    $("profileWhatsapp");

const profileCep =
    $("profileCep");

const profileEndereco =
    $("profileEndereco");

const profileNumero =
    $("profileNumero");

const profileComplemento =
    $("profileComplemento");

const profileBairro =
    $("profileBairro");

const profileCidade =
    $("profileCidade");

const profileEstado =
    $("profileEstado");

const profileReferencia =
    $("profileReferencia");

const profileMessage =
    $("profileMessage");


/* Editar perfil */

const editProfileButton =
    $("editProfileButton");

const editProfileModal =
    $("editProfileModal");

const closeEditProfile =
    $("closeEditProfile");

const cancelEditProfile =
    $("cancelEditProfile");

const editProfileForm =
    $("editProfileForm");

const editNome =
    $("editNome");

const editEmail =
    $("editEmail");

const editCpf =
    $("editCpf");

const editNascimento =
    $("editNascimento");

const editTelefone =
    $("editTelefone");

const editWhatsapp =
    $("editWhatsapp");

const editCep =
    $("editCep");

const editEndereco =
    $("editEndereco");

const editNumero =
    $("editNumero");

const editComplemento =
    $("editComplemento");

const editBairro =
    $("editBairro");

const editCidade =
    $("editCidade");

const editEstado =
    $("editEstado");

const editReferencia =
    $("editReferencia");

const editProfileMessage =
    $("editProfileMessage");

const saveProfileButton =
    $("saveProfileButton");


/* Exclusão */

const deleteAccountButton =
    $("deleteAccountButton");

const deleteAccountModal =
    $("deleteAccountModal");

const closeDeleteAccount =
    $("closeDeleteAccount");

const cancelDeleteAccount =
    $("cancelDeleteAccount");

const deleteAccountPassword =
    $("deleteAccountPassword");

const deleteAccountMessage =
    $("deleteAccountMessage");

const confirmDeleteAccount =
    $("confirmDeleteAccount");


/* ============================================================
   MARKETINK / PUBLICIDADE
   ============================================================ */

const MARKETING_DOCUMENT_PATH = [
    "marketing",
    "banners"
];

function normalizeBannerUrls(value) {
    if (!Array.isArray(value)) return [];
    return value.map(item => {
        if (typeof item === "string") return { imageUrl: cleanText(item), categoryId: "" };
        if (item && typeof item === "object") return { imageUrl: cleanText(item.imageUrl || item.url || item.src || item.imagem || ""), categoryId: cleanText(item.categoryId || item.categoriaId || "") };
        return { imageUrl: "", categoryId: "" };
    }).filter(entry => {
        try { return ["http:", "https:"].includes(new URL(entry.imageUrl).protocol); } catch { return false; }
    }).slice(0, 10);
}

function renderMarketingBanners(section, track, entries) {
    if (!section || !track) return;
    track.innerHTML = "";
    if (!entries.length) { section.hidden = true; return; }
    entries.forEach((entry, index) => {
        const card = document.createElement("a");
        card.className = "casafort-promotion-card";
        card.href = "#";
        card.dataset.categoryId = entry.categoryId || "";
        card.setAttribute("aria-label", `Banner promocional ${index + 1}`);
        const image = document.createElement("img");
        image.src = entry.imageUrl;
        image.alt = `Publicidade ${index + 1}`;
        image.loading = "lazy";
        image.decoding = "async";
        image.draggable = false;
        image.addEventListener("error", () => { card.remove(); if (!track.querySelector(".casafort-promotion-card")) section.hidden = true; }, { once: true });
        card.appendChild(image);
        track.appendChild(card);
    });
    section.hidden = false;
}

async function loadMarketingBanners() {
    if (
        !advertising1Section &&
        !advertising2Section
    ) {
        return;
    }

    try {
        const marketingRef =
            doc(
                db,
                MARKETING_DOCUMENT_PATH[0],
                MARKETING_DOCUMENT_PATH[1]
            );

        const snapshot =
            await getDoc(
                marketingRef
            );

        if (!snapshot.exists()) {
            renderMarketingBanners(
                advertising1Section,
                advertising1Track,
                []
            );

            renderMarketingBanners(
                advertising2Section,
                advertising2Track,
                []
            );

            return;
        }

        const data =
            snapshot.data() || {};

        renderMarketingBanners(
            advertising1Section,
            advertising1Track,
            normalizeBannerUrls(
                data.publicidade1
            )
        );

        renderMarketingBanners(
            advertising2Section,
            advertising2Track,
            normalizeBannerUrls(
                data.publicidade2
            )
        );
    } catch (error) {
        console.error(
            "Erro ao carregar Marketink:",
            error
        );

        renderMarketingBanners(
            advertising1Section,
            advertising1Track,
            []
        );

        renderMarketingBanners(
            advertising2Section,
            advertising2Track,
            []
        );
    }
}


document.addEventListener("click", event => {
    const banner = event.target.closest(".casafort-promotion-card[data-category-id]");
    if (!banner) return;
    const categoryId = String(banner.dataset.categoryId || "").trim();
    if (!categoryId) return;
    event.preventDefault();
    navigateToCategory(categoryId, true);
});


/* ============================================================
   UTILITÁRIOS
   ============================================================ */


/**
 * Obtém valor de várias propriedades possíveis.
 * Isso permite que o painel antigo/novo tenha nomes diferentes.
 */
function firstValue(object, keys, fallback = "") {

    if (!object) {
        return fallback;
    }

    for (const key of keys) {

        if (
            object[key] !== undefined &&
            object[key] !== null &&
            String(object[key]).trim() !== ""
        ) {
            return object[key];
        }
    }

    return fallback;
}


/**
 * Converte qualquer valor possível para número.
 */
function toNumber(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return 0;
    }

    if (typeof value === "number") {

        return Number.isFinite(value)
            ? value
            : 0;
    }

    let text =
        String(value)
            .trim()
            .replace(/[^\d,.-]/g, "");

    if (
        text.includes(",") &&
        text.includes(".")
    ) {

        text =
            text.replace(/\./g, "")
                .replace(",", ".");
    }

    else if (
        text.includes(",")
    ) {

        text =
            text.replace(",", ".");
    }

    const number =
        Number(text);

    return Number.isFinite(number)
        ? number
        : 0;
}


/**
 * Formata moeda brasileira.
 */
function formatCurrency(value) {

    const number =
        toNumber(value);

    return number.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


/**
 * Escapa HTML.
 */
function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/**
 * Retorna string limpa.
 */
function cleanText(value, fallback = "") {

    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    const result =
        String(value).trim();

    return result || fallback;
}


/**
 * Verifica se email é o administrador protegido.
 */
function isProtectedAdmin(user = currentUser) {

    if (!user) {
        return false;
    }

    return (
        String(user.email || "")
            .toLowerCase()
            .trim()
        ===
        PROTECTED_ADMIN_EMAIL
            .toLowerCase()
            .trim()
    );
}


/**
 * Timestamp Firestore para Date.
 */
function timestampToDate(value) {

    if (!value) {
        return null;
    }

    if (
        typeof value.toDate ===
        "function"
    ) {
        return value.toDate();
    }

    if (
        value instanceof Date
    ) {
        return value;
    }

    if (
        typeof value === "number"
    ) {
        return new Date(value);
    }

    return null;
}


/**
 * Formata data.
 */
function formatDate(value) {

    const date =
        timestampToDate(value);

    if (!date) {
        return "-";
    }

    return date.toLocaleDateString(
        "pt-BR"
    );
}


/**
 * Mensagem visual.
 */
function showMessage(
    element,
    message,
    type = "info"
) {

    if (!element) {
        return;
    }

    element.textContent =
        message || "";

    element.className =
        "form-message";

    if (!message) {
        return;
    }

    element.classList.add(
        "show",
        type
    );
}


/**
 * Aguarda pequeno intervalo.
 */
function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}


/* ============================================================
   NORMALIZAÇÃO DOS PRODUTOS DO PAINEL
   ============================================================ */


/**
 * Extrai URL da imagem.
 */
function getProductImage(product) {

    const image =
        firstValue(
            product,
            [
                "imagem",
                "image",
                "foto",
                "fotoUrl",
                "imagemUrl",
                "imageUrl",
                "urlImagem",
                "url",
                "thumbnail"
            ],
            ""
        );

    return cleanText(
        image,
        ""
    );
}


/**
 * Extrai todas as imagens.
 */
function getProductImages(product) {

    const images = [];

    const mainImage =
        getProductImage(product);

    if (mainImage) {
        images.push(mainImage);
    }


    const possibleArrays = [
        product?.imagens,
        product?.images,
        product?.fotos,
        product?.galeria,
        product?.gallery
    ];


    for (
        const array of possibleArrays
    ) {

        if (!Array.isArray(array)) {
            continue;
        }

        for (
            const item of array
        ) {

            let url = "";

            if (
                typeof item ===
                "string"
            ) {

                url = item;
            }

            else if (
                item &&
                typeof item ===
                "object"
            ) {

                url =
                    firstValue(
                        item,
                        [
                            "url",
                            "src",
                            "imagem",
                            "image"
                        ],
                        ""
                    );
            }

            url =
                cleanText(url);

            if (
                url &&
                !images.includes(url)
            ) {

                images.push(url);
            }
        }
    }


    return images;
}


/**
 * Normaliza produto vindo do Firestore.
 */
function normalizeProduct(
    id,
    data
) {
    const basePrice = toNumber(firstValue(data, [
        "valor", "preco", "preço", "price", "precoVenda", "valorVenda"
    ], 0));

    const oferta = data?.oferta === true;
    const percentualOfertaRaw = toNumber(data?.percentualOferta);
    const percentualOferta = oferta
        ? Math.min(100, Math.max(1, Math.round(percentualOfertaRaw || 10)))
        : 0;
    const salePrice = oferta
        ? Math.round(basePrice * (1 - percentualOferta / 100) * 100) / 100
        : basePrice;

    const stockRaw = firstValue(data, [
        "estoque", "stock", "quantidadeEstoque", "qtdEstoque", "quantidade"
    ], null);
    const hasStock = stockRaw !== null && stockRaw !== "" && stockRaw !== undefined;
    const stock = hasStock ? Math.max(0, Math.floor(toNumber(stockRaw))) : null;

    const name = cleanText(firstValue(data, ["nome", "name", "titulo", "title", "produto"], "Produto sem nome"));
    const code = cleanText(firstValue(data, ["codigo", "código", "codigoProduto", "code", "sku", "referencia", "idProduto"], id));
    const description = cleanText(firstValue(data, ["descricao", "descrição", "description", "detalhes", "observacao", "observação"], ""));

    let rating = toNumber(firstValue(data, ["estrelas", "rating", "avaliacao", "avaliação", "nota", "stars"], 0));
    rating = Math.max(0, Math.min(5, rating));
    const reviewCount = Math.max(0, Math.floor(toNumber(firstValue(data, ["avaliacoes", "avaliações", "reviews", "quantidadeAvaliacoes", "numeroAvaliacoes"], 0))));
    const images = getProductImages(data);

    return {
        id,
        ...data,
        nome: name,
        codigo: code,
        descricao: description,
        preco: salePrice,
        precoOriginal: oferta && basePrice > salePrice ? basePrice : (data?.precoOriginal ?? 0),
        estoque: stock,
        temEstoque: hasStock,
        imagens: images,
        imagem: images[0] || "",
        estrelas: rating,
        avaliacoes: reviewCount,
        oferta,
        percentualOferta,
        categoriaId: getProductCategoryId({ ...data }),
        categoriaNome: ""
    };
}

/* ============================================================
   FIRESTORE - CLIENTE
   ============================================================ */


/**
 * Carrega cliente.
 */
async function loadClientData(
    user
) {

    if (!user) {
        return {};
    }

    const ref =
        doc(
            db,
            CLIENTS_COLLECTION,
            user.uid
        );


    const snapshot =
        await getDoc(ref);


    if (!snapshot.exists()) {

        return {

            uid:
                user.uid,

            email:
                user.email || "",

            nome:
                user.displayName || ""

        };
    }


    return {

        uid:
            user.uid,

        ...snapshot.data()

    };
}


/* ============================================================
   FIRESTORE - PRODUTOS
   ============================================================ */


/**
 * Carrega todos os produtos ativos.
 *
 * A consulta usa ativo == true para respeitar
 * as regras do Firestore definidas para a vitrine.
 */
async function loadProducts() {

    if (!productsGrid) {
        return;
    }


    productsGrid.innerHTML = `

        <div class="shop-empty">

            <strong>
                Carregando produtos...
            </strong>

            <span>
                Aguarde um momento.
            </span>

        </div>

    `;


    try {

        const productsRef =
            collection(
                db,
                PRODUCTS_COLLECTION
            );


        const productsQuery =
            query(
                productsRef,
                where(
                    "ativo",
                    "==",
                    true
                )
            );


        const snapshot =
            await getDocs(
                productsQuery
            );


        const products = [];


        snapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();


                const product =
                    normalizeProduct(
                        documentSnapshot.id,
                        data
                    );


                /*
                 * Estoque zero não aparece na vitrine pública.
                 */
                if (
                    product.temEstoque &&
                    Number(product.estoque) <= 0
                ) {
                    return;
                }


                products.push(
                    product
                );

            }
        );


        /*
         * Ordenação:
         * primeiro usa ordem do painel,
         * depois nome.
         */
        products.sort(
            (a, b) => {

                const orderA =
                    toNumber(
                        firstValue(
                            a,
                            [
                                "ordem",
                                "order",
                                "posicao",
                                "posição"
                            ],
                            999999
                        )
                    );


                const orderB =
                    toNumber(
                        firstValue(
                            b,
                            [
                                "ordem",
                                "order",
                                "posicao",
                                "posição"
                            ],
                            999999
                        )
                    );


                if (
                    orderA !==
                    orderB
                ) {

                    return (
                        orderA -
                        orderB
                    );
                }


                return String(
                    a.nome
                ).localeCompare(
                    String(
                        b.nome
                    ),
                    "pt-BR",
                    {
                        sensitivity:
                            "base"
                    }
                );

            }
        );


        allProducts =
            products;


        filteredProducts = selectedCategoryId
            ? products.filter(product => String(getProductCategoryId(product)) === String(selectedCategoryId))
            : [...products];

        renderProducts();
        renderHomeProducts();
        renderCategoryItems();
        renderCategoryStrip();
        updateCategoryPage(selectedCategoryId);

    } catch (error) {

        console.error(
            "Erro ao carregar produtos:",
            error
        );


        productsGrid.innerHTML = `

            <div class="shop-empty">

                <strong>
                    Não foi possível carregar os produtos.
                </strong>

                <span>
                    Verifique sua conexão e tente novamente.
                </span>

            </div>

        `;

    }
}


/* ============================================================
   CATEGORIAS - FIRESTORE / ADMIN -> CLIENTE
   ============================================================ */

function normalizeCategoryName(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ");
}

function getCategoryIcon(category) {
    const name = normalizeCategoryName(
        category?.nome || category || ""
    ).toLowerCase();

    let path =
        '<rect x="5" y="5" width="14" height="14" rx="2"/>' +
        '<path d="M8 9h8M8 13h5"/>';

    if (
        name.includes("tinta") ||
        name.includes("acessório") ||
        name.includes("acessorio")
    ) {
        path =
            '<path d="M7 3h10v8a5 5 0 0 1-10 0V3Z"/>' +
            '<path d="M10 3V1h4v2M12 16v6"/>';
    }

    else if (
        name.includes("porta") ||
        name.includes("janela") ||
        name.includes("ferragen")
    ) {
        path =
            '<rect x="6" y="3" width="12" height="18" rx="1.5"/>' +
            '<path d="M9 3v18M14.5 12h.01"/>';
    }

    else if (name.includes("banheiro")) {
        path =
            '<path d="M5 12h14v2a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5v-2ZM7 12V7a3 3 0 0 1 6 0v2"/>' +
            '<path d="M16 3v5M14 5h4"/>';
    }

    else if (name.includes("cozinha")) {
        path =
            '<path d="M5 13h14a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5Z"/>' +
            '<path d="M8 13V9M12 13V7M16 13V9M7 20h10"/>';
    }

    else if (
        name.includes("climatiza") ||
        name.includes("ar condicionado") ||
        name.includes("refrigera")
    ) {
        path =
            '<rect x="3" y="5" width="18" height="7" rx="2"/>' +
            '<path d="M7 12v3M12 12v5M17 12v3M5 18h4M15 18h4"/>';
    }

    else if (name.includes("casa")) {
        path =
            '<path d="M3 11 12 4l9 7"/>' +
            '<path d="M5 10v10h14V10M9 20v-6h6v6"/>';
    }

    else if (
        name.includes("elétrica") ||
        name.includes("eletrica")
    ) {
        path =
            '<path d="M13 2 5 13h6l-1 9 8-12h-6l1-8Z"/>';
    }

    else if (
        name.includes("ferrament") ||
        name.includes("epi")
    ) {
        path =
            '<path d="m14 6 4 4-8 8H6v-4l8-8ZM13 7l4-4 4 4-4 4"/>';
    }

    else if (
        name.includes("hidrául") ||
        name.includes("hidraul")
    ) {
        path =
            '<path d="M7 4v7a5 5 0 0 0 10 0V7M7 4H4v5M17 7h3v-3h-3"/>' +
            '<path d="M12 16v5"/>';
    }

    else if (name.includes("ilumina")) {
        path =
            '<path d="M9 18h6M10 21h4M8 14a6 6 0 1 1 8 0c-1.3 1.1-2 2.1-2 4h-4c0-1.9-.7-2.9-2-4Z"/>';
    }

    else if (
        name.includes("piso") ||
        name.includes("revest")
    ) {
        path =
            '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>';
    }

    else if (
        name.includes("material") ||
        name.includes("básico") ||
        name.includes("basico")
    ) {
        path =
            '<path d="m4 8 8-5 8 5-8 5-8-5Z"/>' +
            '<path d="m4 13 8 5 8-5M4 8v5M20 8v5"/>';
    }

    return `
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            ${path}
        </svg>
    `;
}
function getProductCategoryId(product) {
    const directId =
        product?.categoriaId ||
        product?.categoryId ||
        (product?.categoria && typeof product.categoria === "object"
            ? product.categoria.id
            : "");

    if (directId) return String(directId);

    const legacyName =
        typeof product?.categoria === "string"
            ? normalizeCategoryName(product.categoria)
            : "";

    if (legacyName) {
        const match = categories.find(
            category =>
                normalizeCategoryName(category.nome).toLowerCase() ===
                legacyName.toLowerCase()
        );
        return match ? String(match.id) : "";
    }

    return "";
}

function getProductCategoryName(product) {
    const id = getProductCategoryId(product);
    if (!id) return "Sem categoria";
    const category = categories.find(item => String(item.id) === String(id));
    return category ? category.nome : "Sem categoria";
}

/*
 * Integração com componentes externos da página de detalhes.
 * Retorna o ID da categoria de um produto já carregado pela vitrine.
 */
window.CasaFortGetProductCategory = function (productId) {
    const product = allProducts.find(
        item => String(item.id) === String(productId)
    );

    if (!product) return "";

    return getProductCategoryId(product);
};

/*
 * Retorna os containers de categorias existentes.
 * Não cria containers extras automaticamente.
 */
function getCategoryContainers() {
    const containers = [];

    document
        .querySelectorAll("#categoryMenu, .client-category-menu, .category-menu")
        .forEach(element => {
            if (!containers.includes(element)) {
                containers.push(element);
            }
        });

    return containers;
}

/*
 * Dentro do hambúrguer deve existir UMA ÚNICA lista.
 * Se o HTML tiver dois ou mais containers antigos,
 * todos os extras são removidos.
 */
function ensureMobileCategoryContainer() {
    if (!mobileMenuDropdown) {
        return null;
    }

    const candidates = [
        ...mobileMenuDropdown.querySelectorAll(
            "#categoryMenu, .client-category-menu, .category-menu"
        )
    ];

    let target =
        candidates.find(element => element.id === "categoryMenu") ||
        candidates.find(element =>
            element.classList.contains("client-category-menu")
        ) ||
        candidates[0] ||
        null;

    if (!target) {
        target = document.createElement("div");
        target.id = "categoryMenu";
        target.className = "client-category-menu";
        target.setAttribute("aria-label", "Categorias");
        mobileMenuDropdown.appendChild(target);
    }

    candidates.forEach(element => {
        if (element !== target && element.parentNode) {
            element.remove();
        }
    });

    target.id = "categoryMenu";
    target.classList.add("client-category-menu");
    target.setAttribute("aria-label", "Categorias");

    return target;
}

/*
 * Remove categorias estáticas antigas que estejam no
 * hambúrguer. A lista final vem EXCLUSIVAMENTE do Admin.
 */
function cleanStaticMobileCategories(target) {
    if (!mobileMenuDropdown || !target) {
        return;
    }

    /*
     * Remove qualquer item de categoria fora do container
     * oficial. Isso impede a duplicação dos nomes.
     */
    mobileMenuDropdown
        .querySelectorAll("[data-category-id]")
        .forEach(element => {
            if (!target.contains(element)) {
                element.remove();
            }
        });

    /*
     * Remove possíveis listas antigas de departamentos.
     */
    mobileMenuDropdown
        .querySelectorAll(
            ".category-list, .departments-list, .department-list"
        )
        .forEach(element => {
            if (!target.contains(element)) {
                element.remove();
            }
        });

    hideMobileCategoryHeader();
}

/*
 * Monta somente as categorias ativas cadastradas no Admin.
 * Cada categoria aparece uma única vez no hambúrguer.
 */
function renderCategoryItems() {
    const activeCategories =
        categories.filter(
            category => category.ativo !== false
        );

    const html =
        activeCategories.map(category => `
            <button
                type="button"
                class="client-category-item ${
                    String(selectedCategoryId) === String(category.id)
                        ? "active"
                        : ""
                }"
                data-category-id="${escapeHtml(category.id)}"
                aria-current="${
                    String(selectedCategoryId) === String(category.id)
                        ? "page"
                        : "false"
                }"
            >
                <span
    class="client-category-item-icon"
    aria-hidden="true"
>
    ${getCategoryIcon(category)}
</span>

<span>
    ${escapeHtml(category.nome)}
</span>
            </button>
        `).join("");

    /*
     * Primeiro resolve o hambúrguer.
     */
    const mobileTarget =
        ensureMobileCategoryContainer();

    if (mobileTarget) {
        mobileTarget.innerHTML = html;
        mobileTarget.classList.add(
            "client-categories-rendered"
        );
        cleanStaticMobileCategories(
            mobileTarget
        );
    }

    /*
     * Se existir uma área de categorias fora do hambúrguer,
     * ela é reutilizada, nunca criada em duplicidade.
     */
    getCategoryContainers().forEach(container => {
        if (!container || container === mobileTarget) {
            return;
        }

        if (
            mobileMenuDropdown &&
            mobileMenuDropdown.contains(container)
        ) {
            return;
        }

        container.innerHTML = html;
        container.classList.add(
            "client-categories-rendered"
        );
    });

    hideMobileCategoryHeader();
}

/*
 * Remove o cabeçalho antigo:
 * "Departamentos"
 * "Escolha uma categoria"
 *
 * Também remove o bloco quando ele for um wrapper
 * visual independente, sem mexer na lista dinâmica.
 */
function hideMobileCategoryHeader() {
    if (!mobileMenuDropdown) {
        return;
    }

    mobileMenuDropdown
        .querySelectorAll("*")
        .forEach(element => {
            if (
                element === mobileMenuDropdown ||
                element.closest("#categoryMenu") ||
                element.closest(".client-category-menu") ||
                element.closest(".category-menu")
            ) {
                return;
            }

            const text =
                String(element.textContent || "")
                    .replace(/\s+/g, " ")
                    .trim()
                    .toLowerCase();

            if (
                text === "departamentos" ||
                text === "escolha uma categoria" ||
                text === "departamentos escolha uma categoria" ||
                (
                    text.includes("departamentos") &&
                    text.includes("escolha uma categoria")
                )
            ) {
                element.style.display = "none";
            }
        });
}

function ensureCategoryContainers() {
    const mobileTarget =
        ensureMobileCategoryContainer();

    if (mobileTarget) {
        cleanStaticMobileCategories(
            mobileTarget
        );
    }

    getCategoryContainers().forEach(container => {
        if (
            container &&
            mobileMenuDropdown &&
            mobileMenuDropdown.contains(container)
        ) {
            return;
        }

        if (container) {
            container.classList.add(
                "client-categories-rendered"
            );
        }
    });

    hideMobileCategoryHeader();

    return {
        menuTarget:
            mobileTarget ||
            getCategoryContainers()[0] ||
            null
    };
}

/*
 * Cria uma visão própria para a categoria selecionada.
 * A categoria também fica na URL:
 * cliente.html?categoria=ID
 *
 * Assim a página pode ser recarregada/compartilhada
 * mantendo a categoria aberta.
 */
function ensureCategoryPageHeader() {
    if (!storeSection) {
        return null;
    }

    let header =
        $("clientCategoryPageHeader");

    if (!header) {
        header =
            document.createElement("section");

        header.id =
            "clientCategoryPageHeader";

        header.className =
            "client-category-page-header";

        header.hidden =
            true;

        if (
            productsGrid &&
            productsGrid.parentNode
        ) {
            productsGrid.parentNode.insertBefore(
                header,
                productsGrid
            );
        } else {
            storeSection.appendChild(
                header
            );
        }
    }

    return header;
}

function updateCategoryPage(categoryId) {
    const header =
        ensureCategoryPageHeader();

    const category =
        categories.find(
            item =>
                String(item.id) ===
                String(categoryId)
        );

    if (!header) {
        return;
    }

    if (!categoryId || !category) {
        header.hidden = true;
        header.innerHTML = "";

        if (sponsoredProductsGrid) {
            sponsoredProductsGrid.hidden =
                false;
        }

        if (mostViewedProductsGrid) {
            mostViewedProductsGrid.hidden =
                false;
        }

        return;
    }

    const productCount =
        filteredProducts.length;

    header.hidden = false;

    header.innerHTML = `
        <button
            type="button"
            class="client-category-back"
            data-category-back
            aria-label="Voltar para todas as categorias"
        >
            <span aria-hidden="true">←</span>
            <span>Todas as categorias</span>
        </button>

        <div class="client-category-page-title">
            <span class="client-category-page-kicker">
                Categoria
            </span>

            <h1>
                ${escapeHtml(category.nome)}
            </h1>

            <span class="client-category-page-count">
                ${productCount}
                ${
                    productCount === 1
                        ? "produto encontrado"
                        : "produtos encontrados"
                }
            </span>
        </div>
    `;

    /*
     * Em uma página de categoria aparecem somente
     * os produtos daquela categoria.
     */
    if (sponsoredProductsGrid) {
        sponsoredProductsGrid.hidden = true;
    }

    if (mostViewedProductsGrid) {
        mostViewedProductsGrid.hidden = true;
    }
}

function getCategoryIdFromUrl() {
    try {
        const url =
            new URL(window.location.href);

        return String(
            url.searchParams.get(
                "categoria"
            ) || ""
        ).trim();
    } catch (error) {
        return "";
    }
}

function navigateToCategory(
    categoryId,
    pushHistory = true
) {
    const id =
        String(categoryId || "").trim();

    selectedCategoryId =
        id;

    if (!id) {
        filteredProducts =
            [...allProducts];
    } else {
        filteredProducts =
            allProducts.filter(
                product =>
                    String(
                        getProductCategoryId(
                            product
                        )
                    ) === id
            );
    }

    if (pushHistory) {
        try {
            const url =
                new URL(
                    window.location.href
                );

            if (id) {
                url.searchParams.set(
                    "categoria",
                    id
                );
            } else {
                url.searchParams.delete(
                    "categoria"
                );
            }

            window.history.pushState(
                {
                    categoria: id
                },
                "",
                `${url.pathname}${url.search}${url.hash}`
            );
        } catch (error) {
            console.warn(
                "Não foi possível atualizar a URL da categoria.",
                error
            );
        }
    }

    showStore();

    if (storeSection) {
        storeSection.classList.toggle(
            "casafort-category-mode",
            Boolean(id)
        );
        storeSection.classList.remove("casafort-search-mode");
    }

    renderCategoryItems();
    renderCategoryStrip();
    renderProducts();
    updateCategoryPage(id);

    closeMobileMenu();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function filterByCategory(categoryId) {
    navigateToCategory(
        categoryId,
        true
    );
}

window.CasaFortNavigateCategory = navigateToCategory;

function bindCategoryEvents() {
    document.addEventListener(
        "click",
        event => {
            const button =
                event.target.closest(
                    "[data-category-id]"
                );

            if (!button) {
                return;
            }

            const insideCategoryArea =
                button.closest(
                    ".client-categories-rendered"
                ) ||
                button.closest(
                    "#categoryMenu"
                ) ||
                button.closest(
                    ".category-menu"
                );

            if (!insideCategoryArea) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            navigateToCategory(
                button.dataset.categoryId || "",
                true
            );
        }
    );

    document.addEventListener(
        "click",
        event => {
            const backButton =
                event.target.closest(
                    "[data-category-back]"
                );

            if (!backButton) {
                return;
            }

            event.preventDefault();

            navigateToCategory(
                "",
                true
            );
        }
    );

    window.addEventListener(
        "popstate",
        () => {
            const categoryId =
                getCategoryIdFromUrl();

            selectedCategoryId =
                categoryId;

            if (allProducts.length) {
                if (categoryId) {
                    filteredProducts =
                        allProducts.filter(
                            product =>
                                String(
                                    getProductCategoryId(
                                        product
                                    )
                                ) === categoryId
                        );
                } else {
                    filteredProducts =
                        [...allProducts];
                }

                renderCategoryItems();
                renderCategoryStrip();
                renderProducts();
                updateCategoryPage(
                    categoryId
                );
            }
        }
    );
}

async function loadCategories() {
    try {
        const snapshot =
            await getDocs(
                collection(
                    db,
                    "categorias"
                )
            );

        categories = [];

        const categoryNamesSeen = new Set();

        snapshot.forEach(
            documentSnapshot => {
                const data =
                    documentSnapshot.data();

                const nome =
                    normalizeCategoryName(
                        data.nome
                    );

                if (!nome || data.ativo === false) {
                    return;
                }

                const nameKey =
                    nome.toLocaleLowerCase("pt-BR");

                if (categoryNamesSeen.has(nameKey)) {
                    return;
                }

                categoryNamesSeen.add(nameKey);

                categories.push({
                    id:
                        documentSnapshot.id,
                    ...data,
                    nome
                });
            }
        );

        categories.sort(
            (a, b) => {
                const ordemA =
                    Number(
                        a.ordem ??
                        999999
                    );

                const ordemB =
                    Number(
                        b.ordem ??
                        999999
                    );

                if (
                    ordemA !==
                    ordemB
                ) {
                    return (
                        ordemA -
                        ordemB
                    );
                }

                return a.nome.localeCompare(
                    b.nome,
                    "pt-BR",
                    {
                        sensitivity:
                            "base"
                    }
                );
            }
        );

        ensureCategoryContainers();
        renderCategoryItems();
        renderCategoryStrip();
    } catch (error) {
        console.error(
            "Erro ao carregar categorias do cliente:",
            error
        );

        categories = [];

        ensureCategoryContainers();
        renderCategoryItems();
    }
}

function renderCategoryStrip() {
    if (!categoryStripTrack) return;
    if (!categories.length) {
        categoryStripTrack.innerHTML = `<div class="casafort-category-loading">Nenhuma categoria disponível.</div>`;
        return;
    }
    categoryStripTrack.innerHTML = categories.map(category => `
        <button type="button" class="casafort-category-card ${String(selectedCategoryId) === String(category.id) ? "active" : ""}" data-strip-category-id="${escapeHtml(category.id)}" aria-label="Ver categoria ${escapeHtml(category.nome)}">
            <span class="casafort-category-card-icon">${getCategoryIcon(category.nome)}</span>
            <span class="casafort-category-card-name">${escapeHtml(category.nome)}</span>
        </button>`).join("");
    updateCategoryStripArrows();
}

function updateCategoryStripArrows() {
    if (!categoryStripTrack) return;
    const canScroll = categoryStripTrack.scrollWidth > categoryStripTrack.clientWidth + 4;
    if (categoryStripPrev) categoryStripPrev.disabled = !canScroll || categoryStripTrack.scrollLeft <= 4;
    if (categoryStripNext) categoryStripNext.disabled = !canScroll || categoryStripTrack.scrollLeft + categoryStripTrack.clientWidth >= categoryStripTrack.scrollWidth - 4;
}

function bindCategoryStripEvents() {
    if (categoryStripTrack && !categoryStripTrack.dataset.bound) {
        categoryStripTrack.dataset.bound = "true";
        categoryStripTrack.addEventListener("click", event => {
            const button = event.target.closest("[data-strip-category-id]");
            if (!button) return;
            event.preventDefault();
            navigateToCategory(button.dataset.stripCategoryId || "", true);
        });
        categoryStripTrack.addEventListener("scroll", updateCategoryStripArrows, { passive: true });
    }
    categoryStripPrev?.addEventListener("click", () => categoryStripTrack?.scrollBy({ left: -Math.max(220, categoryStripTrack.clientWidth * .75), behavior: "smooth" }));
    categoryStripNext?.addEventListener("click", () => categoryStripTrack?.scrollBy({ left: Math.max(220, categoryStripTrack.clientWidth * .75), behavior: "smooth" }));
    window.addEventListener("resize", updateCategoryStripArrows, { passive: true });
}


function injectCategoryStyles() {
    if (
        document.getElementById(
            "clientDynamicCategoryStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "clientDynamicCategoryStyles";

    style.textContent = `
        /*
         * LISTA ÚNICA DE CATEGORIAS
         */
        .client-category-menu,
        .category-menu {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            width: 100%;
            margin: 0;
            padding: 0;
            gap: 0;
            box-sizing: border-box;
        }

        .client-category-item {
            width: 100%;
            min-height: 50px;
            box-sizing: border-box;
            border: 0;
            border-bottom: 1px solid #edf1ee;
            border-radius: 0;
            background: #fff;
            color: #17351f;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            cursor: pointer;
            font: inherit;
            font-weight: 700;
            line-height: 1.25;
            text-align: left;
            white-space: normal;
            transition:
                background-color .18s ease,
                color .18s ease,
                padding-left .18s ease;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }

        .client-category-item:last-child {
            border-bottom: 0;
        }

        .client-category-item:hover,
        .client-category-item:focus-visible,
        .client-category-item.active {
            background: #eaf7ef;
            color: #16803c;
            outline: none;
        }

        .client-category-item:active {
            background: #dff1e6;
        }

        /*
         * PÁGINA DA CATEGORIA
         */
        .client-category-page-header {
            width: 100%;
            box-sizing: border-box;
            margin: 0 0 18px;
            padding: 16px;
            border: 1px solid #e5ebe7;
            border-radius: 16px;
            background: #fff;
        }

        .client-category-back {
            border: 0;
            background: transparent;
            color: #16803c;
            padding: 0;
            margin: 0 0 12px;
            min-height: 40px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font: inherit;
            font-weight: 700;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }

        .client-category-back:focus-visible {
            outline: 2px solid #16803c;
            outline-offset: 4px;
            border-radius: 6px;
        }

        .client-category-page-title {
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
        }

        .client-category-page-kicker {
            color: #16803c;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .04em;
        }

        .client-category-page-title h1 {
            margin: 0;
            color: #17351f;
            font-size: clamp(22px, 3vw, 32px);
            line-height: 1.15;
            overflow-wrap: anywhere;
        }

        .client-category-page-count {
            color: #66736a;
            font-size: 14px;
        }

        /*
         * CELULAR
         */
        @media (max-width: 767px) {
            .client-category-item {
                min-height: 52px;
                padding: 15px 16px;
                font-size: 15px;
            }

            .client-category-page-header {
                margin: 0 0 14px;
                padding: 14px;
                border-radius: 14px;
            }

            .client-category-page-title h1 {
                font-size: 24px;
            }
        }

        /*
         * TABLET
         */
        @media (min-width: 768px) and (max-width: 1199px) {
            .client-category-item {
                min-height: 52px;
                padding: 15px 18px;
            }

            .client-category-page-header {
                padding: 18px;
            }
        }

        /*
         * DESKTOP
         */
        @media (min-width: 1200px) {
            .client-category-page-header {
                padding: 20px;
            }
        }

        /*
         * Se o HTML antigo possuir outro container de
         * categorias dentro do hambúrguer, ele nunca aparece.
         */
        #mobileMenuDropdown
            .category-menu:not(#categoryMenu),
        #mobileMenuDropdown
            .client-category-menu:not(#categoryMenu) {
            display: none !important;
        }
    `;

    document.head.appendChild(
        style
    );
}

/* ============================================================
   VITRINE
   ============================================================ */


/**
 * Cria estrelas da avaliação.
 * Estrelas preenchidas ficam amarelas.
 * Estrelas restantes ficam cinzas.
 */
function createStars(
    rating = 0
) {

    const rounded =
        Math.max(
            0,
            Math.min(
                5,
                Math.round(
                    toNumber(
                        rating
                    )
                )
            )
        );

    let stars = "";

    for (
        let i = 1;
        i <= 5;
        i++
    ) {

        stars +=
            i <= rounded
                ? '<span class="star-filled">★</span>'
                : '<span class="star-empty">★</span>';
    }

    return stars;
}
/**
 * Retorna uma avaliação fixa para cada produto.
 *
 * A avaliação é calculada pelo ID/código/nome do produto.
 * Assim, o mesmo produto sempre terá exatamente
 * a mesma quantidade de estrelas no card e no detalhe.
 */
function getProductDisplayRating(
    product
) {

    const seedText =
        String(
            product &&
            (
                product.id ||
                product.codigo ||
                product.nome ||
                ""
            )
        );

    let seed =
        0;

    for (
        let i = 0;
        i < seedText.length;
        i++
    ) {

        seed =
            (
                (
                    seed << 5
                ) -
                seed +
                seedText.charCodeAt(i)
            ) |
            0;
    }

    return (
        Math.abs(seed) % 3
    ) + 3;
}
/**
 * Renderiza um produto.
 */
function createProductCard(
    product,
    source = "store"
) {

    /* ============================================================
       FAVORITO
       ============================================================ */

    const favorite =
        favorites.includes(
            product.id
        );


    /* ============================================================
       IMAGEM
       ============================================================ */

    const image =
        product.imagem;


    /* ============================================================
       PREÇO ATUAL
       ============================================================ */

    const currentPrice =
        toNumber(
            product.preco
        );


    const price =
        formatCurrency(
            currentPrice
        );


    /* ============================================================
       PREÇO ANTERIOR / DESCONTO
       ============================================================ */

    const possibleOriginalPrices = [
        product.precoOriginal,
        product.precoAnterior,
        product.valorOriginal,
        product.valorAnterior,
        product.precoDe,
        product.precoAntigo
    ];


    let originalPrice =
        0;


    for (
        const value of possibleOriginalPrices
    ) {

        const number =
            toNumber(value);


        if (
            number > currentPrice
        ) {

            originalPrice =
                number;

            break;
        }
    }


    let discountPercent =
        0;


    if (
        originalPrice > currentPrice &&
        currentPrice > 0
    ) {

        discountPercent =
            Math.round(
                (
                    (
                        originalPrice -
                        currentPrice
                    ) /
                    originalPrice
                ) *
                100
            );
    }


    const originalPriceHtml =
        originalPrice > currentPrice
            ? `
                <div class="shop-product-old-price">
                    ${formatCurrency(originalPrice)}
                </div>
              `
            : "";


    const discountHtml =
        discountPercent > 0
            ? `
                <span class="shop-product-discount">
                    ${discountPercent}% OFF
                </span>
              `
            : "";


    /* ============================================================
       ESTOQUE
       ============================================================ */

    const stockAvailable =
        !product.temEstoque ||
        product.estoque > 0;


    const stockText =
        product.temEstoque
            ? product.estoque > 0
                ? ""
                : "Produto indisponível"
            : "";


   /* ============================================================
   AVALIAÇÃO
============================================================ */

if (
    !product._displayRating
) {

    product._displayRating =
        getProductDisplayRating(
            product
        );
}

const displayRating =
    product._displayRating;

const ratingStars =
    createStars(
        displayRating
    );

const rating =
    displayRating;


/* ============================================================
   QUANTIDADE DE AVALIAÇÕES
============================================================ */

let reviewCount =
    toNumber(
        product.avaliacoes
    );


/*
 * Caso não exista quantidade cadastrada,
 * cria um número demonstrativo diferente
 * para cada produto.
 */

if (
    reviewCount <= 0
) {

    let reviewSeed =
        0;


    const reviewText =
        String(
            product.id ||
            product.codigo ||
            product.nome ||
            ""
        );


    for (
        let i = 0;
        i < reviewText.length;
        i++
    ) {

        reviewSeed =
            (
                (
                    reviewSeed << 5
                ) -
                reviewSeed +
                reviewText.charCodeAt(i)
            ) |
            0;
    }


    const reviewOptions = [
        17,
        23,
        31,
        38,
        44,
        52,
        67,
        73,
        86,
        94
    ];


    reviewCount =
        reviewOptions[
            Math.abs(reviewSeed) %
            reviewOptions.length
        ];
}


const ratingCount =
    `
        <span
            class="shop-product-rating-count"
        >
            (${escapeHtml(reviewCount)})
        </span>
    `;

   /* ============================================================
   PARCELAMENTO
============================================================ */

let installments =
    toNumber(
        product.parcelas ??
        product.maxParcelas ??
        product.quantidadeParcelas ??
        product.numeroParcelas ??
        product.parcelamento ??
        product.installments
    );

/*
 * Quando o Admin não grava um número de parcelas, usa a mesma
 * lógica de parcelamento da versão anterior da vitrine.
 * Isso devolve o "Xx de R$ ... sem juros" que existia nos cards.
 */
if (installments <= 0) {
    if (currentPrice >= 1000) installments = 12;
    else if (currentPrice >= 700) installments = 10;
    else if (currentPrice >= 400) installments = 8;
    else if (currentPrice >= 250) installments = 6;
    else if (currentPrice >= 150) installments = 4;
    else if (currentPrice >= 80) installments = 3;
    else installments = 1;
}

let installmentHtml =
    `<div class="shop-product-installments">`;

if (installments > 1 && currentPrice > 0) {
    const installmentValue = currentPrice / installments;
    installmentHtml += `
        ${installments}x de
        <strong>${formatCurrency(installmentValue)}</strong>
        sem juros
    `;
}

installmentHtml += `</div>`;

    const offerActive = product.oferta === true;
    const offerPercent = offerActive
        ? Math.min(
            100,
            Math.max(
                1,
                Math.round(
                    toNumber(
                        product.percentualOferta ||
                        discountPercent ||
                        10
                    )
                )
            )
        )
        : 0;

    const offerLineHtml = offerActive
        ? `<div class="shop-product-offer-line" aria-label="Produto em oferta">OFERTA <strong>-${offerPercent}%</strong></div>`
        : "";

    /*
     * A descrição completa fica somente no detalhe do produto.
     * O card mostra apenas as informações essenciais.
     */

    /* ============================================================
       CARD
       ============================================================ */

    return `

        <article
            class="shop-product-card"
            data-product-id="${escapeHtml(product.id)}"
            data-categoria-id="${escapeHtml(
                product.categoriaId || getProductCategoryId(product) || ""
            )}"
            data-offer="${offerActive ? "true" : "false"}"
        >

            ${offerLineHtml}

            <!-- FAVORITO -->

            <button
                type="button"
                class="shop-favorite-button ${favorite ? "active" : ""}"
                data-action="favorite"
                data-product-id="${escapeHtml(product.id)}"
                aria-label="${
                    favorite
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                }"
                aria-pressed="${favorite ? "true" : "false"}"
            >
                ${favorite ? "♥" : "♡"}
            </button>


            <!-- IMAGEM -->

            <div
                class="shop-product-image-wrap"
            >

                ${discountHtml}


                <button
                    type="button"
                    class="shop-product-image-button"
                    data-action="details"
                    data-product-id="${escapeHtml(product.id)}"
                    aria-label="Ver detalhes de ${escapeHtml(product.nome)}"
                >

                    ${
                        image
                            ? `
                                <img
                                    src="${escapeHtml(image)}"
                                    alt="${escapeHtml(product.nome)}"
                                    loading="lazy"
                                    referrerpolicy="no-referrer"
                                    onerror="this.style.display='none';this.parentElement.querySelector('.shop-image-fallback').hidden=false;"
                                >

                                <span
                                    class="shop-image-fallback shop-product-image-placeholder"
                                    hidden
                                >
                                    Sem imagem
                                </span>
                              `
                            : `
                                <span
                                    class="shop-product-image-placeholder"
                                >
                                    Sem imagem
                                </span>
                              `
                    }

                </button>

            </div>

            <!-- CONTEÚDO -->

            <div
                class="shop-product-content"
            >


                <!-- CÓDIGO -->

                <div
                    class="shop-product-code"
                >
                    Código:
                    ${escapeHtml(product.codigo)}
                </div>


                <!-- NOME -->

                <button
                    type="button"
                    class="shop-product-title-button"
                    data-action="details"
                    data-product-id="${escapeHtml(product.id)}"
                >
                    ${escapeHtml(product.nome)}
                </button>

                <!-- AVALIAÇÃO -->

                <div
                    class="shop-product-rating"
                    aria-label="Avaliação ${rating} de 5"
                >

                    <span>
                        ${ratingStars}
                    </span>

                    ${ratingCount}

                </div>


                <!-- PREÇO ANTIGO -->

                ${originalPriceHtml}


                <!-- PREÇO ATUAL -->

                <div
                    class="shop-product-price"
                >
                    ${price}

                    ${
                        discountPercent > 0
                            ? `
                                <span
                                    class="shop-product-discount-text"
                                >
                                    ${discountPercent}% OFF
                                </span>
                              `
                            : ""
                    }
                </div>


                <!-- PARCELAMENTO -->

                ${installmentHtml}


                <!-- ESTOQUE -->

                ${
                    stockText
                        ? `
                            <div
                                style="
                                    margin-top:5px;
                                    margin-bottom:5px;
                                    color:#b42318;
                                    font-size:10px;
                                    font-weight:700;
                                "
                            >
                                ${stockText}
                            </div>
                          `
                        : ""
                }


                <!-- BOTÃO -->

                <button
                    type="button"
                    class="shop-product-button"
                    data-action="add"
                    data-product-id="${escapeHtml(product.id)}"
                    ${stockAvailable ? "" : "disabled"}
                >

                    ${
                        stockAvailable
                            ? "Adicionar ao carrinho"
                            : "Indisponível"
                    }

                </button>


            </div>

        </article>

    `;
}
/* ============================================================
   PRODUTOS PATROCINADOS / MAIS VISTOS
   ============================================================ */

function renderShelf(grid, items, emptyTitle) {
    if (!grid) return;
    const products = items.slice(0, 10);
    if (!products.length) {
        grid.innerHTML = `<div class="shop-empty"><strong>${escapeHtml(emptyTitle)}</strong><span>Os produtos selecionados no Admin aparecerão aqui.</span></div>`;
        return;
    }
    grid.innerHTML = products.map(product => createProductCard(product, "home-shelf")).join("");
}

function getHomeAvailableProducts() {
    return allProducts.filter(product => !(product.temEstoque && Number(product.estoque) <= 0));
}

function renderOffers() {
    if (!offersProductsGrid) return;
    const offers = getHomeAvailableProducts().filter(product => product.oferta === true);
    if (!offers.length) {
        offersProductsGrid.innerHTML = `<div class="shop-empty"><strong>Nenhuma oferta disponível.</strong><span>As ofertas cadastradas no Admin aparecerão aqui.</span></div>`;
        return;
    }
    offersProductsGrid.innerHTML = offers.map(product => createProductCard(product, "offers")).join("");
}

function renderHomeProducts() {
    const homeProducts = getHomeAvailableProducts();
    renderShelf(sponsoredProductsGrid, homeProducts.filter(product => product.produtoPatrocinado === true), "Nenhum produto patrocinado.");
    renderShelf(mostViewedProductsGrid, homeProducts.filter(product => product.produtoMaisVisto === true), "Nenhum produto selecionado em Mais Vistos.");
    renderShelf(youMayLikeProductsGrid, homeProducts.filter(product => product.produtoVocePodeGostar === true), "Nenhum produto selecionado em Você pode também gostar.");
    renderShelf(bestSellingProductsGrid, homeProducts.filter(product => product.produtoMaisVendido === true), "Nenhum produto selecionado em Mais Vendidos.");
    renderOffers();
}
/**
 * Renderiza vitrine.
 */
function renderProducts() {

    if (!productsGrid) {
        return;
    }


    if (
        filteredProducts.length === 0
    ) {

        productsGrid.innerHTML = `

            <div class="shop-empty">

                <strong>
                    Nenhum produto encontrado.
                </strong>

                <span>
                    Tente pesquisar por outro nome ou código.
                </span>

            </div>

        `;

        return;
    }


    productsGrid.innerHTML =
        filteredProducts
            .map(
                product =>
                    createProductCard(
                        product
                    )
            )
            .join("");
}


function searchProducts() {

    let term =
        cleanText(
            productSearch?.value
        ).toLowerCase();

    /*
     * PROTEÇÃO:
     * Se o navegador/autofill colocar um e-mail
     * dentro da barra de pesquisa, não usamos esse
     * valor para filtrar a vitrine.
     */
    if (
        term.includes("@") &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(term)
    ) {

        if (productSearch) {
            productSearch.value = "";
            productSearch.removeAttribute("value");
        }

        term = "";
    }

    if (!term) {

        filteredProducts =
            [...allProducts];

    } else {

        filteredProducts =
            allProducts.filter(
                product => {

                    const searchable = [

                        product.nome,

                        product.codigo,

                        product.descricao,

                        product.categoria,

                        product.categoriaNome,

                        getProductCategoryName(product),

                        product.subcategoria,

                        product.marca,

                        product.sku

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return searchable.includes(
                        term
                    );
                }
            );
    }

    if (storeSection) {
        storeSection.classList.toggle("casafort-search-mode", Boolean(term));
        if (term) storeSection.classList.remove("casafort-category-mode");
    }

    renderProducts();

    if (searchClear) {
        searchClear.hidden = !term;
    }
}

/* ============================================================
   FAVORITOS
   ============================================================ */


/**
 * Salva favoritos no cliente.
 */
async function saveFavorites() {

    if (!currentUser) {
        return;
    }


    if (isSavingFavorite) {
        return;
    }


    isSavingFavorite =
        true;


    try {

        const clientRef =
            doc(
                db,
                CLIENTS_COLLECTION,
                currentUser.uid
            );


        await setDoc(
            clientRef,
            {
                favoritos:
                    favorites
            },
            {
                merge:
                    true
            }
        );


    } catch (error) {

        console.error(
            "Erro ao salvar favoritos:",
            error
        );

    } finally {

        isSavingFavorite =
            false;

    }
}


/**
 * Alterna favorito.
 */
async function toggleFavorite(
    productId
) {

    if (!currentUser) {

        alert(
            "Faça login para salvar seus favoritos."
        );

        return;
    }


    const index =
        favorites.indexOf(
            productId
        );


    let isFavorite;


    if (index >= 0) {

        /*
         * REMOVE DOS FAVORITOS
         */
        favorites.splice(
            index,
            1
        );

        isFavorite = false;

    } else {

        /*
         * ADICIONA AOS FAVORITOS
         */
        favorites.push(
            productId
        );

        isFavorite = true;
    }


    /*
     * ATUALIZA IMEDIATAMENTE
     * TODOS OS CORAÇÕES DESSE PRODUTO.
     */
    document
        .querySelectorAll(
            '[data-action="favorite"]'
        )
        .forEach(
            button => {

                if (
                    button.dataset.productId !==
                    String(productId)
                ) {
                    return;
                }


                button.classList.toggle(
                    "active",
                    isFavorite
                );


                button.setAttribute(
                    "aria-pressed",
                    isFavorite
                        ? "true"
                        : "false"
                );


                button.setAttribute(
                    "aria-label",
                    isFavorite
                        ? "Remover dos favoritos"
                        : "Adicionar aos favoritos"
                );


                button.textContent =
                    isFavorite
                        ? "♥"
                        : "♡";
            }
        );


    /*
     * Atualiza a lista principal.
     */
    renderProducts();


    /*
     * Atualiza Produtos Patrocinados
     * e Produtos Mais Vistos, se existir.
     */
    if (
        typeof renderFeaturedProducts ===
        "function"
    ) {

        renderFeaturedProducts();
    }


    /*
     * Atualiza a tela de favoritos.
     */
    renderFavorites();


    /*
     * Salva no Firebase.
     */
    await saveFavorites();

}


/**
 * Carrega favoritos.
 */
function loadFavoritesFromClient() {

    const stored =
        currentClientData?.favoritos;


    if (
        Array.isArray(stored)
    ) {

        favorites =
            stored
                .map(
                    value =>
                        String(value)
                )
                .filter(Boolean);

    } else {

        favorites = [];

    }
}


/**
 * Renderiza favoritos.
 */
function renderFavorites() {

    if (!favoritesGrid) {
        return;
    }


    const favoriteProducts =
        allProducts.filter(
            product =>
                favorites.includes(
                    product.id
                )
        );


    if (
        favoriteProducts.length === 0
    ) {

        favoritesGrid.innerHTML = `

            <div class="shop-empty">

                <strong>
                    Você ainda não tem favoritos.
                </strong>

                <span>
                    Toque no coração de um produto para adicioná-lo aqui.
                </span>

            </div>

        `;

        return;
    }


    favoritesGrid.innerHTML =
        favoriteProducts
            .map(
                product =>
                    createProductCard(
                        product,
                        "favorites"
                    )
            )
            .join("");
}
/* ============================================================
   DETALHES DO PRODUTO
   ============================================================ */


/**
 * Abre modal.
 */

/* ============================================================
   PRODUTOS RELACIONADOS — DETALHE DO PRODUTO
   ============================================================ */

function getRelatedProducts(product) {
    if (!product) return [];

    const available = allProducts.filter(item =>
        item &&
        item.id !== product.id &&
        !(item.temEstoque && Number(item.estoque) <= 0)
    );

    const categoryId =
        String(getProductCategoryId(product) || "").trim();

    /* Relacionados = exclusivamente a mesma categoria.
       Não mistura outras categorias apenas para preencher espaço. */
    if (!categoryId) {
        return [];
    }

    return available
        .filter(item =>
            String(getProductCategoryId(item) || "").trim() === categoryId
        )
        .slice(0, 8);
}

function renderRelatedProducts() {
    if (!relatedProductsSection || !relatedProductsTrack) return;

    const related = getRelatedProducts(currentProduct);

    if (!related.length) {
        relatedProductsSection.hidden = true;
        relatedProductsTrack.innerHTML = "";
        return;
    }

    relatedProductsSection.hidden = false;

    relatedProductsTrack.innerHTML = related.map(product => {
        const image = cleanText(product.imagem || "");
        const price = formatCurrency(toNumber(product.preco));

        return `
            <article
                class="casafort-related-card"
                data-product-id="${escapeHtml(product.id)}"
            >
                <button
                    type="button"
                    class="casafort-related-open"
                    data-action="details"
                    data-product-id="${escapeHtml(product.id)}"
                    aria-label="Ver detalhes de ${escapeHtml(product.nome)}"
                >
                    <div class="casafort-related-media">
                        ${
                            image
                                ? `
                                    <img
                                        class="casafort-related-image"
                                        src="${escapeHtml(image)}"
                                        alt="${escapeHtml(product.nome)}"
                                        loading="lazy"
                                        referrerpolicy="no-referrer"
                                        onerror="this.classList.add('is-broken');this.nextElementSibling.hidden=false;"
                                    >
                                    <span
                                        class="casafort-related-image-placeholder"
                                        hidden
                                    >
                                        Sem imagem
                                    </span>
                                  `
                                : `
                                    <span class="casafort-related-image-placeholder">
                                        Sem imagem
                                    </span>
                                  `
                        }
                    </div>

                    <div class="casafort-related-body">
                        <h4 class="casafort-related-title">
                            ${escapeHtml(product.nome)}
                        </h4>

                        <div class="casafort-related-price-label">
                            Por apenas
                        </div>

                        <div class="casafort-related-price">
                            ${price}
                        </div>
                    </div>
                </button>
            </article>
        `;
    }).join("");

    updateRelatedProductsArrows();
}

function updateRelatedProductsArrows() {
    if (!relatedProductsTrack) return;

    const maxScroll = Math.max(
        0,
        relatedProductsTrack.scrollWidth -
        relatedProductsTrack.clientWidth
    );

    if (relatedProductsPrev) {
        relatedProductsPrev.disabled =
            relatedProductsTrack.scrollLeft <= 2;
    }

    if (relatedProductsNext) {
        relatedProductsNext.disabled =
            relatedProductsTrack.scrollLeft >= maxScroll - 2;
    }
}

function scrollRelatedProducts(direction) {
    if (!relatedProductsTrack) return;

    const amount = Math.max(
        240,
        Math.round(relatedProductsTrack.clientWidth * 0.82)
    );

    relatedProductsTrack.scrollBy({
        left: direction * amount,
        behavior: "smooth"
    });
}

function openProductDetails(
    productId
) {

    const product =
        allProducts.find(
            item =>
                item.id ===
                productId
        );


    if (!product) {

        console.warn(
            "Produto não encontrado:",
            productId
        );

        return;
    }


    currentProduct =
        product;


    currentProductImages =
        product.imagens?.length
            ? [...product.imagens]
            : [];


    currentProductImageIndex =
        0;


    currentDetailQuantity =
        1;


    if (detailQuantity) {

        detailQuantity.value =
            "1";
    }


    if (detailTitle) {

        detailTitle.textContent =
            product.nome;
    }


    if (detailCode) {

        detailCode.textContent =
            `Código: ${product.codigo}`;
    }


    if (detailRating) {

    const displayRating =
        getProductDisplayRating(
            product
        );

    detailRating.innerHTML =
        createStars(
            displayRating
        );

    detailRating.setAttribute(
        "aria-label",
        `Avaliação ${displayRating} de 5`
    );

}

    const detailCurrentPrice =
        toNumber(product.preco);

    const detailBasePrice =
        toNumber(
            firstValue(
                product,
                [
                    "precoOriginal",
                    "precoAnterior",
                    "valorOriginal",
                    "valorAnterior",
                    "precoDe",
                    "precoAntigo"
                ],
                0
            )
        );

    const detailDiscount =
        product.oferta === true
            ? Math.min(
                100,
                Math.max(
                    1,
                    Math.round(
                        toNumber(
                            product.percentualOferta ||
                            (
                                detailBasePrice > detailCurrentPrice
                                    ? ((detailBasePrice - detailCurrentPrice) / detailBasePrice) * 100
                                    : 10
                            )
                        )
                    )
                )
            )
            : 0;

    if (detailOffer) {
        if (product.oferta === true) {
            detailOffer.hidden = false;
            detailOffer.textContent = `OFERTA · -${detailDiscount}%`;
        } else {
            detailOffer.hidden = true;
            detailOffer.textContent = "";
        }
    }

    if (detailOldPrice) {
        if (detailBasePrice > detailCurrentPrice && detailCurrentPrice > 0) {
            detailOldPrice.hidden = false;
            detailOldPrice.textContent =
                formatCurrency(detailBasePrice);
        } else {
            detailOldPrice.hidden = true;
            detailOldPrice.textContent = "";
        }
    }

    if (detailPrice) {
        detailPrice.textContent =
            formatCurrency(detailCurrentPrice);
    }

    if (detailInstallments) {
        let detailInstallmentsCount =
            toNumber(
                product.parcelas ??
                product.maxParcelas ??
                product.quantidadeParcelas ??
                product.numeroParcelas ??
                product.parcelamento ??
                product.installments
            );

        if (detailInstallmentsCount <= 0) {
            if (detailCurrentPrice >= 1000) detailInstallmentsCount = 12;
            else if (detailCurrentPrice >= 700) detailInstallmentsCount = 10;
            else if (detailCurrentPrice >= 400) detailInstallmentsCount = 8;
            else if (detailCurrentPrice >= 250) detailInstallmentsCount = 6;
            else if (detailCurrentPrice >= 150) detailInstallmentsCount = 4;
            else if (detailCurrentPrice >= 80) detailInstallmentsCount = 3;
            else detailInstallmentsCount = 1;
        }

        if (
            detailInstallmentsCount > 1 &&
            detailCurrentPrice > 0
        ) {
            const value =
                detailCurrentPrice /
                detailInstallmentsCount;

            detailInstallments.hidden = false;
            detailInstallments.innerHTML =
                `${detailInstallmentsCount}x de <strong>${formatCurrency(value)}</strong> sem juros`;
        } else {
            detailInstallments.hidden = true;
            detailInstallments.textContent = "";
        }
    }


    if (detailDescription) {

        detailDescription.textContent =
            product.descricao ||
            "Nenhuma descrição disponível para este produto.";
    }


    if (detailStock) {

        if (product.temEstoque) {

            detailStock.textContent =
                product.estoque > 0
                    ? `${product.estoque} unidade(s) disponível(is)`
                    : "Produto indisponível";

        } else {

            detailStock.textContent =
                "";

        }
    }


    if (detailAddButton) {

        detailAddButton.disabled =
            product.temEstoque &&
            product.estoque <= 0;
    }


    renderDetailGallery();

    /* Restaura a faixa de produtos relacionados abaixo do detalhe. */
    renderRelatedProducts();

    showMessage(
        detailMessage,
        ""
    );


    if (productModal) {

        productModal.hidden =
            false;

        document.body.style.overflow =
            "hidden";

        /*
         * Cria uma entrada no histórico apenas para o detalhe.
         * Assim o botão Voltar e o botão voltar do navegador
         * retornam exatamente à página/vitrine anterior.
         */
        if (!productModalHistoryActive) {
            try {
                const url =
                    new URL(window.location.href);

                url.hash =
                    `produto=${encodeURIComponent(product.id)}`;

                window.history.pushState(
                    {
                        ...(window.history.state || {}),
                        casafortProduct: product.id
                    },
                    "",
                    `${url.pathname}${url.search}${url.hash}`
                );

                productModalHistoryActive = true;
            } catch (error) {
                console.warn(
                    "Não foi possível registrar o detalhe no histórico.",
                    error
                );
            }
        }
    }

}


/**
 * Renderiza galeria.
 */
function renderDetailGallery() {

    if (!currentProduct) {
        return;
    }


    const images =
        currentProductImages;


    const fallback =
        currentProduct.imagem ||
        "";


    if (detailMainImage) {

        const src =
            images.length
                ? images[currentProductImageIndex]
                : fallback;


        if (src) {

            detailMainImage.src =
                src;

            detailMainImage.alt =
                currentProduct.nome;

            detailMainImage.style.display =
                "block";

        } else {

            detailMainImage.removeAttribute(
                "src"
            );

            detailMainImage.alt =
                "Produto sem imagem";

            detailMainImage.style.display =
                "none";
        }
    }


    if (detailThumbs) {

        if (
            images.length <= 1
        ) {

            detailThumbs.innerHTML =
                "";

        } else {

            detailThumbs.innerHTML =
                images
                    .map(
                        (image, index) => `

                            <button
                                type="button"
                                class="shop-detail-thumb ${
                                    index === currentProductImageIndex
                                        ? "active"
                                        : ""
                                }"
                                data-detail-image-index="${index}"
                                aria-label="Imagem ${index + 1}"
                            >

                                <img
                                    src="${escapeHtml(image)}"
                                    alt=""
                                    loading="lazy"
                                >

                            </button>

                        `
                    )
                    .join("");
        }
    }

}


/**
 * Fecha detalhes.
 */
function closeProductDetails(fromHistory = false) {

    if (!productModal) {
        return;
    }

    const shouldReturnInHistory =
        productModalHistoryActive &&
        !fromHistory &&
        !closingProductModalFromHistory;

    productModal.hidden =
        true;

    currentProduct =
        null;

    currentProductImages =
        [];

    currentProductImageIndex =
        0;

    if (relatedProductsTrack) {
        relatedProductsTrack.innerHTML = "";
        relatedProductsTrack.scrollLeft = 0;
    }

    if (relatedProductsSection) {
        relatedProductsSection.hidden = true;
    }

    document.body.style.overflow =
        "";

    if (detailOffer) {
        detailOffer.hidden = true;
        detailOffer.textContent = "";
    }

    if (detailOldPrice) {
        detailOldPrice.hidden = true;
        detailOldPrice.textContent = "";
    }

    if (detailInstallments) {
        detailInstallments.hidden = true;
        detailInstallments.textContent = "";
    }

    if (shouldReturnInHistory) {
        productModalHistoryActive = false;
        try {
            window.history.back();
        } catch (error) {
            console.warn(
                "Não foi possível retornar pelo histórico.",
                error
            );
        }
    } else {
        productModalHistoryActive = false;
    }

    closingProductModalFromHistory = false;
}


/* ============================================================
   CARRINHO
   ============================================================ */


/**
 * Normaliza item do carrinho.
 */
function normalizeCartItem(
    item
) {

    if (!item) {
        return null;
    }


    const productId =
        String(
            firstValue(
                item,
                [
                    "productId",
                    "produtoId",
                    "id"
                ],
                ""
            )
        );


    if (!productId) {
        return null;
    }


    const quantity =
        Math.max(
            1,
            Math.floor(
                toNumber(
                    firstValue(
                        item,
                        [
                            "quantity",
                            "quantidade",
                            "qty"
                        ],
                        1
                    )
                )
            )
        );


    const product =
        allProducts.find(
            p =>
                p.id ===
                productId
        );


    /*
     * O produto do painel é a fonte oficial
     * de nome/preço/imagem.
     */
    if (product) {

        return {

            productId,

            quantity,

            nome:
                product.nome,

            preco:
                product.preco,

            imagem:
                product.imagem,

            codigo:
                product.codigo

        };
    }


    /*
     * Se o produto foi desativado depois
     * de estar no carrinho, preservamos
     * os dados existentes para não apagar
     * o carrinho do cliente.
     */
    return {

        productId,

        quantity,

        nome:
            cleanText(
                firstValue(
                    item,
                    [
                        "nome",
                        "name"
                    ],
                    "Produto"
                )
            ),

        preco:
            toNumber(
                firstValue(
                    item,
                    [
                        "preco",
                        "price",
                        "valor"
                    ],
                    0
                )
            ),

        imagem:
            cleanText(
                firstValue(
                    item,
                    [
                        "imagem",
                        "image",
                        "foto"
                    ],
                    ""
                )
            ),

        codigo:
            cleanText(
                firstValue(
                    item,
                    [
                        "codigo",
                        "code",
                        "sku"
                    ],
                    productId
                )
            )

    };
}


/**
 * Carrega carrinho do cliente.
 */
function loadCartFromClient() {

    const stored =
        currentClientData?.carrinho;


    if (!Array.isArray(stored)) {

        cart = [];

        return;
    }


    cart =
        stored
            .map(
                item =>
                    normalizeCartItem(
                        item
                    )
            )
            .filter(Boolean);


    /*
     * Remove quantidades inválidas.
     */
    cart =
        cart.filter(
            item =>
                item.quantity > 0
        );
}


/**
 * Converte carrinho para Firestore.
 */
function serializeCart() {

    return cart.map(
        item => ({

            productId:
                item.productId,

            quantity:
                item.quantity,

            nome:
                item.nome,

            preco:
                toNumber(
                    item.preco
                ),

            imagem:
                item.imagem || "",

            codigo:
                item.codigo || ""

        })
    );
}


/**
 * Salva carrinho.
 */
async function saveCart() {

    if (!currentUser) {
        return;
    }


    if (isSavingCart) {

        /*
         * Não interrompe a aplicação.
         * O próximo evento poderá salvar novamente.
         */
        return;
    }


    isSavingCart =
        true;


    try {

        const clientRef =
            doc(
                db,
                CLIENTS_COLLECTION,
                currentUser.uid
            );


        await setDoc(
            clientRef,
            {
                carrinho:
                    serializeCart()
            },
            {
                merge:
                    true
            }
        );


        /*
         * Mantém o estado local coerente.
         */
        currentClientData.carrinho =
            serializeCart();


    } catch (error) {

        console.error(
            "Erro ao salvar carrinho:",
            error
        );


        showMessage(
            checkoutMessage,
            "Não foi possível salvar o carrinho. Tente novamente.",
            "error"
        );

    } finally {

        isSavingCart =
            false;

    }
}


/**
 * Retorna quantidade total de unidades.
 */
function getCartQuantity() {

    return cart.reduce(
        (
            total,
            item
        ) => {

            return (
                total +
                Math.max(
                    0,
                    Math.floor(
                        toNumber(
                            item.quantity
                        )
                    )
                )
            );

        },
        0
    );
}


/**
 * Retorna total financeiro.
 *
 * IMPORTANTE:
 * A soma é sempre:
 *
 * preço unitário × quantidade
 *
 * para cada item.
 */

/* ============================================================
   FRETE — CONFIGURAÇÃO DO PAINEL ADMINISTRATIVO
   Lê configuracoes/entrega do Firestore.
   Não usa valor fictício.
============================================================ */

function normalizeDeliveryCep(value) {
    return String(value ?? "")
        .replace(/\D/g, "")
        .slice(0, 8);
}

function formatDeliveryCep(value) {
    const digits = normalizeDeliveryCep(value);

    if (digits.length <= 5) {
        return digits;
    }

    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function setCartDeliveryMessage(message = "", type = "") {
    if (!cartDeliveryMessage) {
        return;
    }

    cartDeliveryMessage.textContent = message;
    cartDeliveryMessage.className =
        "casafort-cart-shipping-message";

    if (message && type) {
        cartDeliveryMessage.classList.add(type);
    }
}

function resetDeliveryCalculation() {
    deliveryCost = null;
    deliveryCalculated = false;
    deliveryCep = "";

    if (cartDeliveryCost) {
        cartDeliveryCost.textContent =
            "Calcule seu frete";
    }

    setCartDeliveryMessage("");
}

function getDeliveryRangeNumbers(rule) {
    const start = normalizeDeliveryCep(
        rule?.cepInicial ??
        rule?.inicio ??
        rule?.cepInicio ??
        ""
    );

    const end = normalizeDeliveryCep(
        rule?.cepFinal ??
        rule?.fim ??
        rule?.cepFim ??
        ""
    );

    if (
        start.length !== 8 ||
        end.length !== 8
    ) {
        return null;
    }

    return {
        start: Number(start),
        end: Number(end)
    };
}

async function loadClientDeliverySettings() {
    if (deliverySettings) {
        return deliverySettings;
    }

    const deliveryRef =
        doc(
            db,
            DELIVERY_DOCUMENT_PATH[0],
            DELIVERY_DOCUMENT_PATH[1]
        );

    const snapshot =
        await getDoc(deliveryRef);

    if (!snapshot.exists()) {
        deliverySettings = {
            metodo: "fixo",
            valorFixo: 0,
            faixasCep: []
        };

        return deliverySettings;
    }

    deliverySettings =
        snapshot.data() || {};

    return deliverySettings;
}

function calculateConfiguredDelivery(cep, settings) {
    const destination =
        Number(
            normalizeDeliveryCep(cep)
        );

    if (
        !Number.isFinite(destination) ||
        String(destination).length < 8
    ) {
        return {
            ok: false,
            message: "Informe um CEP válido com 8 números."
        };
    }

    const method =
        String(
            settings?.metodo ||
            "fixo"
        ).trim().toLowerCase();

    /*
     * Frete fixo configurado pelo Admin.
     */
    if (
        method === "fixo" ||
        method === "valor_fixo" ||
        method === "frete_fixo"
    ) {
        const value =
            Math.max(
                0,
                toNumber(
                    settings?.valorFixo ??
                    settings?.valor ??
                    0
                )
            );

        return {
            ok: true,
            cost: value,
            label:
                value > 0
                    ? "Frete calculado conforme configuração da loja."
                    : "Entrega gratuita para este método."
        };
    }

    /*
     * Faixas de CEP configuradas pelo Admin.
     */
    if (
        method === "faixa_cep" ||
        method === "faixas_cep" ||
        method === "cep" ||
        method === "por_faixa_de_cep"
    ) {
        const rules =
            Array.isArray(settings?.faixasCep)
                ? settings.faixasCep
                : [];

        for (const rule of rules) {
            const range =
                getDeliveryRangeNumbers(
                    rule
                );

            if (!range) {
                continue;
            }

            const lower =
                Math.min(
                    range.start,
                    range.end
                );

            const upper =
                Math.max(
                    range.start,
                    range.end
                );

            if (
                destination >= lower &&
                destination <= upper
            ) {
                const value =
                    Math.max(
                        0,
                        toNumber(
                            rule?.valor ??
                            rule?.preco ??
                            rule?.frete ??
                            rule?.valorFrete ??
                            0
                        )
                    );

                return {
                    ok: true,
                    cost: value,
                    label:
                        value > 0
                            ? "Frete calculado para sua região."
                            : "Entrega gratuita para sua região."
                };
            }
        }

        return {
            ok: false,
            message:
                "Não encontramos uma faixa de entrega para este CEP."
        };
    }

    /*
     * Correios:
     * não inventamos preço. A configuração do painel
     * pode indicar PAC/SEDEX, mas a cotação real exige
     * uma API/backend autorizado.
     */
    if (
        method === "correios" ||
        method === "pac" ||
        method === "sedex"
    ) {
        return {
            ok: false,
            message:
                "A cotação dos Correios ainda precisa da integração de preço. Nenhum valor foi inventado."
        };
    }

    return {
        ok: false,
        message:
            "O método de frete configurado no painel não é reconhecido."
    };
}

async function calculateCartDelivery() {
    if (!cartDeliveryCep) {
        return;
    }

    const cep =
        normalizeDeliveryCep(
            cartDeliveryCep.value
        );

    if (cep.length !== 8) {
        deliveryCalculated = false;
        deliveryCost = null;

        if (cartDeliveryCost) {
            cartDeliveryCost.textContent =
                "Calcule seu frete";
        }

        setCartDeliveryMessage(
            "Digite um CEP válido com 8 números.",
            "error"
        );

        cartDeliveryCep.focus();
        updateCartSummary();
        return;
    }

    if (calculateDeliveryButton) {
        calculateDeliveryButton.disabled = true;
        calculateDeliveryButton.textContent =
            "Calculando...";
    }

    setCartDeliveryMessage(
        "Consultando as configurações de entrega..."
    );

    try {
        const settings =
            await loadClientDeliverySettings();

        const result =
            calculateConfiguredDelivery(
                cep,
                settings
            );

        if (!result.ok) {
            deliveryCost = null;
            deliveryCalculated = false;
            deliveryCep = "";

            if (cartDeliveryCost) {
                cartDeliveryCost.textContent =
                    "Não disponível";
            }

            setCartDeliveryMessage(
                result.message,
                "error"
            );

            updateCartSummary();
            return;
        }

        deliveryCost =
            Math.max(
                0,
                toNumber(result.cost)
            );

        deliveryCep = cep;
        deliveryCalculated = true;

        if (cartDeliveryCost) {
            cartDeliveryCost.textContent =
                formatCurrency(deliveryCost);
        }

        setCartDeliveryMessage(
            result.label,
            "success"
        );

        updateCartSummary();

    } catch (error) {
        console.error(
            "Erro ao calcular frete:",
            error
        );

        deliveryCost = null;
        deliveryCalculated = false;
        deliveryCep = "";

        if (cartDeliveryCost) {
            cartDeliveryCost.textContent =
                "Não disponível";
        }

        setCartDeliveryMessage(
            "Não foi possível consultar as configurações de entrega. Verifique o Firestore.",
            "error"
        );

        updateCartSummary();

    } finally {
        if (calculateDeliveryButton) {
            calculateDeliveryButton.disabled = false;
            calculateDeliveryButton.textContent =
                "Calcular";
        }
    }
}

function prepareCartDeliveryCep() {
    if (
        !cartDeliveryCep ||
        cartDeliveryCep.value
    ) {
        return;
    }

    const clientCep =
        normalizeDeliveryCep(
            currentClientData?.cep
        );

    if (clientCep.length === 8) {
        cartDeliveryCep.value =
            formatDeliveryCep(clientCep);
    }
}

function getCartFinalTotal() {
    const subtotal =
        getCartTotal();

    if (
        !deliveryCalculated ||
        deliveryCost === null
    ) {
        return subtotal;
    }

    return (
        subtotal +
        Math.max(
            0,
            toNumber(deliveryCost)
        )
    );
}

function getCartTotal() {

    return cart.reduce(
        (
            total,
            item
        ) => {

            const price =
                toNumber(
                    item.preco
                );


            const quantity =
                Math.max(
                    0,
                    Math.floor(
                        toNumber(
                            item.quantity
                        )
                    )
                );


            return (
                total +
                (
                    price *
                    quantity
                )
            );

        },
        0
    );
}


/**
 * Retorna subtotal de um item.
 */
function getCartItemTotal(
    item
) {

    return (
        toNumber(
            item.preco
        ) *
        Math.max(
            0,
            Math.floor(
                toNumber(
                    item.quantity
                )
            )
        )
    );
}


/**
 * Atualiza contador e total.
 */
function updateCartSummary() {

    const quantity =
        getCartQuantity();

    const subtotal =
        getCartTotal();

    const finalTotal =
        getCartFinalTotal();

    if (cartCount) {
        cartCount.textContent =
            String(quantity);
    }

    if (cartSubtotal) {
        cartSubtotal.textContent =
            formatCurrency(subtotal);
    }

    if (cartDeliveryCost) {
        if (
            deliveryCalculated &&
            deliveryCost !== null
        ) {
            cartDeliveryCost.textContent =
                formatCurrency(deliveryCost);
        } else {
            cartDeliveryCost.textContent =
                "Calcule seu frete";
        }
    }

    if (cartTotal) {
        cartTotal.textContent =
            formatCurrency(finalTotal);
    }

    if (checkoutButton) {
        /*
         * Com frete configurado, exigimos a cotação
         * antes de liberar a finalização.
         */
        checkoutButton.disabled =
            cart.length === 0 ||
            subtotal <= 0 ||
            !deliveryCalculated;
    }
}


/**
 * Adiciona produto.
 */
async function addToCart(
    productId,
    quantity = 1
) {

    if (!currentUser) {

        alert(
            "Faça login para adicionar produtos ao carrinho."
        );

        return;
    }


    const product =
        allProducts.find(
            item =>
                item.id ===
                productId
        );


    if (!product) {

        alert(
            "Produto não encontrado."
        );

        return;
    }


    let amount =
        Math.floor(
            toNumber(
                quantity
            )
        );


    if (
        !Number.isFinite(
            amount
        ) ||
        amount < 1
    ) {

        amount =
            1;
    }


    /*
     * Respeita estoque quando o painel
     * informa estoque numérico.
     */
    const existing =
        cart.find(
            item =>
                item.productId ===
                productId
        );


    const currentQuantity =
        existing
            ? existing.quantity
            : 0;


    const newQuantity =
        currentQuantity +
        amount;


    if (
        product.temEstoque &&
        newQuantity >
        product.estoque
    ) {

        alert(
            `Quantidade indisponível. Estoque atual: ${product.estoque}.`
        );

        return;
    }


    if (existing) {

        existing.quantity =
            newQuantity;

        /*
         * Atualiza dados do produto
         * com o que veio do painel.
         */
        existing.nome =
            product.nome;

        existing.preco =
            product.preco;

        existing.imagem =
            product.imagem;

        existing.codigo =
            product.codigo;

    } else {

        cart.push({

            productId:
                product.id,

            quantity:
                amount,

            nome:
                product.nome,

            preco:
                product.preco,

            imagem:
                product.imagem,

            codigo:
                product.codigo

        });
    }


    /*
     * Atualiza imediatamente a interface.
     */
    renderCart();


    await saveCart();


    /*
     * Feedback discreto.
     */
    showMessage(
        checkoutMessage,
        `${product.nome} foi adicionado ao carrinho.`,
        "success"
    );


    setTimeout(
        () => {

            if (
                checkoutMessage &&
                checkoutMessage.textContent
                    .includes(
                        "foi adicionado"
                    )
            ) {

                showMessage(
                    checkoutMessage,
                    ""
                );
            }

        },
        1800
    );
}


/**
 * Remove item.
 */
async function removeCartItem(
    productId
) {

    cart =
        cart.filter(
            item =>
                item.productId !==
                productId
        );


    renderCart();

    await saveCart();
}


/**
 * Define quantidade.
 */
async function setCartQuantity(
    productId,
    quantity
) {

    const item =
        cart.find(
            cartItem =>
                cartItem.productId ===
                productId
        );


    if (!item) {
        return;
    }


    const product =
        allProducts.find(
            productItem =>
                productItem.id ===
                productId
        );


    let newQuantity =
        Math.floor(
            toNumber(
                quantity
            )
        );


    if (
        !Number.isFinite(
            newQuantity
        )
    ) {

        newQuantity =
            1;
    }


    if (
        newQuantity <= 0
    ) {

        await removeCartItem(
            productId
        );

        return;
    }


    if (
        product?.temEstoque &&
        newQuantity >
        product.estoque
    ) {

        newQuantity =
            product.estoque;
    }


    if (
        newQuantity <= 0
    ) {

        await removeCartItem(
            productId
        );

        return;
    }


    item.quantity =
        newQuantity;


    /*
     * Atualiza preço com o preço
     * atual do painel.
     */
    if (product) {

        item.nome =
            product.nome;

        item.preco =
            product.preco;

        item.imagem =
            product.imagem;

        item.codigo =
            product.codigo;
    }


    renderCart();

    await saveCart();
}


/**
 * Incrementa quantidade.
 */
async function increaseCartItem(
    productId
) {

    const item =
        cart.find(
            cartItem =>
                cartItem.productId ===
                productId
        );


    if (!item) {
        return;
    }


    await setCartQuantity(
        productId,
        item.quantity + 1
    );
}


/**
 * Diminui quantidade.
 */
async function decreaseCartItem(
    productId
) {

    const item =
        cart.find(
            cartItem =>
                cartItem.productId ===
                productId
        );


    if (!item) {
        return;
    }


    await setCartQuantity(
        productId,
        item.quantity - 1
    );
}


/**
 * Renderiza carrinho.
 */
function renderCart() {

    if (!cartItems) {
        return;
    }


    updateCartSummary();


    if (
        cart.length === 0
    ) {

        resetDeliveryCalculation();

        cartItems.innerHTML = `

            <div class="shop-empty">

                <strong>
                    Seu carrinho está vazio.
                </strong>

                <span>
                    Adicione produtos da vitrine.
                </span>

            </div>

        `;

        return;
    }


    /*
     * A linha de seleção é criada aqui.
     * O HTML base não precisa possuir
     * outro sistema de seleção.
     */
    const selectAllChecked =
        cart.length > 0 &&
        cart.every(
            item =>
                item.selected === true
        );


    const selectRow = `

        <div class="shop-cart-select-row">

            <label class="shop-cart-select-all">

                <input
                    id="selectAllCart"
                    type="checkbox"
                    ${selectAllChecked ? "checked" : ""}
                >

                <span>
                    Selecionar todos
                </span>

            </label>


            <button
                id="deleteSelectedCart"
                type="button"
                class="shop-btn danger"
                style="
                    min-height:32px;
                    padding:0 9px;
                    font-size:10px;
                "
            >
                Excluir selecionados
            </button>

        </div>

    `;


    const itemsHtml =
        cart.map(
            item => {

                const subtotal =
                    getCartItemTotal(
                        item
                    );


                return `

                    <div
                        class="shop-cart-item"
                        data-cart-product-id="${escapeHtml(item.productId)}"
                    >


                        <input
                            type="checkbox"
                            class="shop-cart-checkbox cart-item-select"
                            data-product-id="${escapeHtml(item.productId)}"
                            ${
                                item.selected
                                    ? "checked"
                                    : ""
                            }
                            aria-label="Selecionar ${escapeHtml(item.nome)}"
                        >


                        <div
                            class="shop-cart-item-image"
                        >

                            ${
                                item.imagem
                                    ? `
                                        <img
                                            src="${escapeHtml(item.imagem)}"
                                            alt="${escapeHtml(item.nome)}"
                                            loading="lazy"
                                            referrerpolicy="no-referrer"
                                        >
                                      `
                                    : ""
                            }

                        </div>


                        <div
                            class="shop-cart-item-info"
                        >

                            <span
                                class="shop-cart-item-name"
                                title="${escapeHtml(item.nome)}"
                            >
                                ${escapeHtml(item.nome)}
                            </span>


                            <div
                                class="shop-cart-item-price"
                            >
                                ${formatCurrency(item.preco)}
                                cada
                            </div>


                            <div
                                class="shop-cart-item-controls"
                            >

                                <button
                                    type="button"
                                    class="shop-cart-qty-button"
                                    data-cart-action="decrease"
                                    data-product-id="${escapeHtml(item.productId)}"
                                    aria-label="Diminuir quantidade"
                                >
                                    −
                                </button>


                                <span
                                    class="shop-cart-qty"
                                >
                                    ${item.quantity}
                                </span>


                                <button
                                    type="button"
                                    class="shop-cart-qty-button"
                                    data-cart-action="increase"
                                    data-product-id="${escapeHtml(item.productId)}"
                                    aria-label="Aumentar quantidade"
                                >
                                    +
                                </button>


                                <button
                                    type="button"
                                    class="shop-cart-remove"
                                    data-cart-action="remove"
                                    data-product-id="${escapeHtml(item.productId)}"
                                >
                                    Excluir
                                </button>

                            </div>


                            <div
                                style="
                                    margin-top:6px;
                                    color:#0f693f;
                                    font-size:12px;
                                    font-weight:850;
                                "
                            >
                                Subtotal:
                                ${formatCurrency(subtotal)}
                            </div>

                        </div>

                    </div>

                `;
            }
        )
        .join("");


    cartItems.innerHTML =
        selectRow +
        itemsHtml;


    updateCartSummary();
}


/**
 * Exclui selecionados.
 */
async function deleteSelectedCartItems() {

    const selectedIds =
        cart
            .filter(
                item =>
                    item.selected === true
            )
            .map(
                item =>
                    item.productId
            );


    if (
        selectedIds.length === 0
    ) {

        return;
    }


    cart =
        cart.filter(
            item =>
                !selectedIds.includes(
                    item.productId
                )
        );


    renderCart();

    await saveCart();
}


/**
 * Seleciona/desmarca item.
 */
async function toggleCartSelection(
    productId,
    selected
) {

    const item =
        cart.find(
            cartItem =>
                cartItem.productId ===
                productId
        );


    if (!item) {
        return;
    }


    item.selected =
        Boolean(selected);


    /*
     * Seleção não precisa ser gravada
     * no Firestore para não poluir o
     * carrinho entre dispositivos.
     */
    renderCart();
}


/**
 * Abre carrinho.
 */
function openCart() {

    if (!cartDrawer) {
        return;
    }


    cartDrawer.hidden =
        false;


    if (cartOverlay) {

        cartOverlay.hidden =
            false;
    }


    document.body.style.overflow =
        "hidden";

    prepareCartDeliveryCep();

    renderCart();
}


/**
 * Fecha carrinho.
 */
function closeCart() {

    if (cartDrawer) {

        cartDrawer.hidden =
            true;
    }


    if (cartOverlay) {

        cartOverlay.hidden =
            true;
    }


    document.body.style.overflow =
        "";
}


/* ============================================================
   CHECKOUT
   ============================================================ */


/**
 * Retorna endereço completo.
 */
function getClientAddress(
    data
) {

    const parts = [

        data?.endereco ||
            data?.rua,

        data?.numero,

        data?.complemento,

        data?.bairro,

        data?.cidade,

        data?.estado,

        data?.cep

    ]
        .map(
            value =>
                cleanText(value)
        )
        .filter(Boolean);


    return parts.join(
        ", "
    );
}


/**
 * Valida carrinho antes do pedido.
 */
function validateCartBeforeCheckout() {

    if (
        cart.length === 0
    ) {

        return {
            ok:
                false,

            message:
                "Seu carrinho está vazio."
        };
    }


    for (
        const item of cart
    ) {

        const product =
            allProducts.find(
                productItem =>
                    productItem.id ===
                    item.productId
            );


        if (!product) {

            /*
             * Produto pode ter sido desativado.
             */
            continue;
        }


        if (
            product.temEstoque &&
            item.quantity >
            product.estoque
        ) {

            return {

                ok:
                    false,

                message:
                    `O produto "${product.nome}" possui somente ${product.estoque} unidade(s) em estoque.`
            };
        }


        if (
            product.temEstoque &&
            product.estoque <= 0
        ) {

            return {

                ok:
                    false,

                message:
                    `O produto "${product.nome}" está sem estoque.`
            };
        }

    }


    return {
        ok:
            true
    };
}


/**
 * Monta itens oficiais do pedido.
 *
 * O preço vem novamente do produto
 * carregado do painel.
 */
function buildOrderItems() {

    return cart.map(
        item => {

            const product =
                allProducts.find(
                    productItem =>
                        productItem.id ===
                        item.productId
                );


            const price =
                product
                    ? toNumber(
                        product.preco
                    )
                    : toNumber(
                        item.preco
                    );


            const quantity =
                Math.max(
                    1,
                    Math.floor(
                        toNumber(
                            item.quantity
                        )
                    )
                );


            return {

                produtoId:
                    item.productId,

                productId:
                    item.productId,

                codigo:
                    product?.codigo ||
                    item.codigo ||
                    item.productId,

                nome:
                    product?.nome ||
                    item.nome ||
                    "Produto",

                imagem:
                    product?.imagem ||
                    item.imagem ||
                    "",

                preco:
                    price,

                quantidade:
                    quantity,

                subtotal:
                    price *
                    quantity

            };

        }
    );
}


/**
 * Finaliza compra.
 *
 * Também é disponibilizada como:
 * window.finalizarCompra(items)
 *
 * para compatibilidade com código
 * legado caso algum elemento externo
 * ainda chame essa função.
 */
async function finalizarCompra(
    optionalItems = null
) {

    if (!currentUser) {

        return {

            ok:
                false,

            success:
                false,

            message:
                "Você precisa estar conectado para finalizar a compra."

        };
    }


    if (
        isProtectedAdmin()
    ) {

        /*
         * O administrador pode ter acesso
         * à área, mas não deve ser tratado
         * como cliente comum.
         */
        return {

            ok:
                false,

            success:
                false,

            message:
                "Esta conta administrativa não pode realizar pedidos pela área do cliente."

        };
    }


    /*
     * Se algum código externo fornecer
     * itens, normalizamos esses itens.
     *
     * Caso contrário usamos o carrinho atual.
     */
    if (
        Array.isArray(
            optionalItems
        ) &&
        optionalItems.length > 0
    ) {

        cart =
            optionalItems
                .map(
                    item =>
                        normalizeCartItem(
                            item
                        )
                )
                .filter(Boolean);
    }


    const validation =
        validateCartBeforeCheckout();


    if (
        !validation.ok
    ) {

        showMessage(
            checkoutMessage,
            validation.message,
            "error"
        );


        return {

            ok:
                false,

            success:
                false,

            message:
                validation.message

        };
    }


    if (
        !deliveryCalculated ||
        deliveryCost === null
    ) {
        showMessage(
            checkoutMessage,
            "Calcule o frete antes de finalizar a compra.",
            "error"
        );

        if (cartDeliveryCep) {
            cartDeliveryCep.focus();
        }

        return {
            ok: false,
            success: false,
            message:
                "Calcule o frete antes de finalizar a compra."
        };
    }

    const orderItems =
        buildOrderItems();


    const subtotal =
        orderItems.reduce(
            (
                sum,
                item
            ) => {

                return (
                    sum +
                    toNumber(
                        item.subtotal
                    )
                );

            },
            0
        );

    const freight =
        Math.max(
            0,
            toNumber(deliveryCost)
        );

    const total =
        subtotal +
        freight;


    if (
        total <= 0
    ) {

        return {

            ok:
                false,

            success:
                false,

            message:
                "O valor total do carrinho é inválido."

        };
    }


    if (checkoutButton) {

        checkoutButton.disabled =
            true;

        checkoutButton.textContent =
            "Finalizando...";
    }


    showMessage(
        checkoutMessage,
        "Registrando seu pedido...",
        "info"
    );


    try {

        const client =
            currentClientData || {};


        const customerName =
            cleanText(
                client.nome,
                currentUser.displayName ||
                "Cliente"
            );


        const customerEmail =
            cleanText(
                client.email,
                currentUser.email ||
                ""
            );


        const customerPhone =
            cleanText(
                client.telefone ||
                client.whatsapp,
                ""
            );


        const address =
            getClientAddress(
                client
            );


        /*
         * Criação do pedido.
         *
         * Não fazemos update em produtos aqui,
         * pois as regras atuais permitem leitura
         * pública somente dos produtos ativos e
         * atualização de produtos somente ao admin.
         */
        const orderData = {

            clienteId:
                currentUser.uid,

            uid:
                currentUser.uid,

            userId:
                currentUser.uid,

            clienteEmail:
                customerEmail,

            email:
                customerEmail,

            clienteNome:
                customerName,

            nomeCliente:
                customerName,

            telefone:
                customerPhone,

            whatsapp:
                cleanText(
                    client.whatsapp,
                    ""
                ),

            cep:
                cleanText(
                    client.cep,
                    ""
                ),

            endereco:
                cleanText(
                    client.endereco ||
                    client.rua,
                    ""
                ),

            numero:
                cleanText(
                    client.numero,
                    ""
                ),

            complemento:
                cleanText(
                    client.complemento,
                    ""
                ),

            bairro:
                cleanText(
                    client.bairro,
                    ""
                ),

            cidade:
                cleanText(
                    client.cidade,
                    ""
                ),

            estado:
                cleanText(
                    client.estado,
                    ""
                ),

            referencia:
                cleanText(
                    client.referencia,
                    ""
                ),

            enderecoCompleto:
                address,

            items:
                orderItems,

            produtos:
                orderItems,

            total:
                total,

            valorTotal:
                total,

            subtotal:
                subtotal,

            frete:
                freight,

            valorFrete:
                freight,

            cepFrete:
                deliveryCep,

            totalComFrete:
                total,

            status:
                "pendente",

            dataPedido:
                serverTimestamp(),

            criadoEm:
                serverTimestamp()

        };


        const ordersRef =
            collection(
                db,
                ORDERS_COLLECTION
            );


        const orderReference =
            await addDoc(
                ordersRef,
                orderData
            );


        /*
         * Pedido criado com sucesso.
         *
         * Limpamos o carrinho do cliente.
         */
        cart = [];

        resetDeliveryCalculation();

        if (cartDeliveryCep) {
            cartDeliveryCep.value = "";
        }


        await saveCart();


        renderCart();


        showMessage(
            checkoutMessage,
            `Pedido realizado com sucesso! Número: ${orderReference.id}`,
            "success"
        );


        /*
         * Recarrega pedidos.
         */
        await loadOrders();


        /*
         * Fecha carrinho depois de um pequeno
         * intervalo para o usuário ver a confirmação.
         */
        setTimeout(
            () => {

                closeCart();

            },
            1200
        );


        return {

            ok:
                true,

            success:
                true,

            id:
                orderReference.id,

            orderId:
                orderReference.id,

            message:
                `Pedido realizado com sucesso! Número: ${orderReference.id}`

        };


    } catch (error) {

        console.error(
            "Erro ao finalizar compra:",
            error
        );


        let message =
            "Não foi possível finalizar o pedido.";


        if (
            error?.code ===
            "permission-denied"
        ) {

            message =
                "O Firebase recusou a criação do pedido. Verifique as regras do Firestore para a coleção pedidos.";

        }

        else if (
            error?.code ===
            "unavailable"
        ) {

            message =
                "O Firebase está temporariamente indisponível. Tente novamente.";

        }


        showMessage(
            checkoutMessage,
            message,
            "error"
        );


        return {

            ok:
                false,

            success:
                false,

            message:
                message,

            error:
                error?.code ||
                "unknown"

        };


    } finally {

        if (checkoutButton) {

            checkoutButton.disabled =
                cart.length === 0 ||
                getCartTotal() <= 0 ||
                !deliveryCalculated;

            checkoutButton.textContent =
                "Finalizar compra";
        }

    }
}


/* ============================================================
   PEDIDOS
   ============================================================ */


/**
 * Carrega pedidos do cliente.
 */
async function loadOrders() {

    if (
        !currentUser ||
        !ordersList
    ) {
        return;
    }


    ordersList.innerHTML = `

        <div class="shop-empty">

            <strong>
                Carregando pedidos...
            </strong>

            <span>
                Aguarde um momento.
            </span>

        </div>

    `;


    try {

        /*
         * Consulta por clienteId.
         *
         * O campo é criado pelo checkout.
         */
        const ordersRef =
            collection(
                db,
                ORDERS_COLLECTION
            );


        const ordersQuery =
            query(
                ordersRef,
                where(
                    "clienteId",
                    "==",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(
                ordersQuery
            );


        const orders = [];


        snapshot.forEach(
            snapshotItem => {

                orders.push({

                    id:
                        snapshotItem.id,

                    ...snapshotItem.data()

                });

            }
        );


        orders.sort(
            (
                a,
                b
            ) => {

                const dateA =
                    timestampToDate(
                        a.dataPedido ||
                        a.criadoEm
                    );


                const dateB =
                    timestampToDate(
                        b.dataPedido ||
                        b.criadoEm
                    );


                if (!dateA && !dateB) {
                    return 0;
                }


                if (!dateA) {
                    return 1;
                }


                if (!dateB) {
                    return -1;
                }


                return (
                    dateB.getTime() -
                    dateA.getTime()
                );
            }
        );


        renderOrders(
            orders
        );


    } catch (error) {

        console.error(
            "Erro ao carregar pedidos:",
            error
        );


        /*
         * Compatibilidade:
         * se a consulta por clienteId
         * falhar por regra/estrutura,
         * mostramos uma mensagem clara.
         */
        ordersList.innerHTML = `

            <div class="shop-empty">

                <strong>
                    Não foi possível carregar seus pedidos.
                </strong>

                <span>
                    Tente novamente mais tarde.
                </span>

            </div>

        `;
    }
}


/**
 * Renderiza pedidos.
 */
function renderOrders(
    orders
) {

    if (!ordersList) {
        return;
    }


    if (
        orders.length === 0
    ) {

        ordersList.innerHTML = `

            <div class="shop-empty">

                <strong>
                    Você ainda não realizou pedidos.
                </strong>

                <span>
                    Seus pedidos aparecerão aqui.
                </span>

            </div>

        `;

        return;
    }


    ordersList.innerHTML =
        orders
            .map(
                order => {

                    const items =
                        Array.isArray(
                            order.items
                        )
                            ? order.items
                            : Array.isArray(
                                order.produtos
                            )
                                ? order.produtos
                                : [];


                    const total =
                        toNumber(
                            firstValue(
                                order,
                                [
                                    "total",
                                    "valorTotal"
                                ],
                                0
                            )
                        );


                    const date =
                        formatDate(
                            order.dataPedido ||
                            order.criadoEm
                        );


                    const status =
                        cleanText(
                            order.status,
                            "pendente"
                        );


                    const statusLabel =
                        translateOrderStatus(
                            status
                        );


                    const itemsHtml =
                        items.length
                            ? items
                                .map(
                                    item => {

                                        const quantity =
                                            Math.max(
                                                1,
                                                Math.floor(
                                                    toNumber(
                                                        firstValue(
                                                            item,
                                                            [
                                                                "quantidade",
                                                                "quantity"
                                                            ],
                                                            1
                                                        )
                                                    )
                                                )
                                            );


                                        const name =
                                            cleanText(
                                                firstValue(
                                                    item,
                                                    [
                                                        "nome",
                                                        "name"
                                                    ],
                                                    "Produto"
                                                )
                                            );


                                        const subtotal =
                                            toNumber(
                                                firstValue(
                                                    item,
                                                    [
                                                        "subtotal"
                                                    ],
                                                    toNumber(
                                                        firstValue(
                                                            item,
                                                            [
                                                                "preco",
                                                                "price"
                                                            ],
                                                            0
                                                        )
                                                    ) *
                                                    quantity
                                                )
                                            );


                                        return `

                                            <div class="shop-order-item">

                                                <span>
                                                    ${escapeHtml(name)}
                                                    × ${quantity}
                                                </span>

                                                <strong>
                                                    ${formatCurrency(subtotal)}
                                                </strong>

                                            </div>

                                        `;

                                    }
                                )
                                .join("")
                            : `
                                <div class="shop-order-item">
                                    <span>
                                        Itens do pedido
                                    </span>
                                </div>
                              `;


                    return `

                        <article class="shop-order-card">


                            <div class="shop-order-header">

                                <div>

                                    <div class="shop-order-number">
                                        Pedido #${escapeHtml(order.id)}
                                    </div>

                                    <div class="shop-order-date">
                                        ${date}
                                    </div>

                                </div>


                                <span class="shop-order-status">
                                    ${escapeHtml(statusLabel)}
                                </span>

                            </div>


                            <div class="shop-order-items">

                                ${itemsHtml}

                            </div>


                            <div class="shop-order-total">
                                Total:
                                ${formatCurrency(total)}
                            </div>


                        </article>

                    `;

                }
            )
            .join("");
}


/**
 * Traduz status.
 */
function translateOrderStatus(
    status
) {

    const value =
        String(
            status
        )
            .toLowerCase()
            .trim();


    const map = {

        pendente:
            "Pendente",

        pending:
            "Pendente",

        confirmado:
            "Confirmado",

        confirmed:
            "Confirmado",

        preparando:
            "Preparando",

        processing:
            "Preparando",

        enviado:
            "Enviado",

        shipped:
            "Enviado",

        entregue:
            "Entregue",

        delivered:
            "Entregue",

        cancelado:
            "Cancelado",

        canceled:
            "Cancelado",

        concluido:
            "Concluído",

        completed:
            "Concluído"

    };


    return (
        map[value] ||
        status ||
        "Pendente"
    );
}


/* ============================================================
   PERFIL
   ============================================================ */


/**
 * Preenche perfil.
 */
function renderProfile() {

    const data =
        currentClientData || {};


    const values = {

        nome:
            cleanText(
                data.nome,
                currentUser?.displayName ||
                "Cliente"
            ),

        email:
            cleanText(
                data.email,
                currentUser?.email ||
                "-"
            ),

        cpf:
            cleanText(
                data.cpf,
                "-"
            ),

        nascimento:
            cleanText(
                data.dataNascimento ||
                data.nascimento,
                "-"
            ),

        telefone:
            cleanText(
                data.telefone,
                "-"
            ),

        whatsapp:
            cleanText(
                data.whatsapp,
                "-"
            ),

        cep:
            cleanText(
                data.cep,
                "-"
            ),

        endereco:
            cleanText(
                data.endereco ||
                data.rua,
                "-"
            ),

        numero:
            cleanText(
                data.numero,
                "-"
            ),

        complemento:
            cleanText(
                data.complemento,
                "-"
            ),

        bairro:
            cleanText(
                data.bairro,
                "-"
            ),

        cidade:
            cleanText(
                data.cidade,
                "-"
            ),

        estado:
            cleanText(
                data.estado,
                "-"
            ),

        referencia:
            cleanText(
                data.referencia,
                "-"
            )

    };


    if (profileNome) {

        profileNome.textContent =
            values.nome;
    }


    if (profileEmail) {

        profileEmail.textContent =
            values.email;
    }


    if (profileCpf) {

        profileCpf.textContent =
            values.cpf;
    }


    if (profileNascimento) {

        profileNascimento.textContent =
            values.nascimento;
    }


    if (profileTelefone) {

        profileTelefone.textContent =
            values.telefone;
    }


    if (profileWhatsapp) {

        profileWhatsapp.textContent =
            values.whatsapp;
    }


    if (profileCep) {

        profileCep.textContent =
            values.cep;
    }


    if (profileEndereco) {

        profileEndereco.textContent =
            values.endereco;
    }


    if (profileNumero) {

        profileNumero.textContent =
            values.numero;
    }


    if (profileComplemento) {

        profileComplemento.textContent =
            values.complemento;
    }


    if (profileBairro) {

        profileBairro.textContent =
            values.bairro;
    }


    if (profileCidade) {

        profileCidade.textContent =
            values.cidade;
    }


    if (profileEstado) {

        profileEstado.textContent =
            values.estado;
    }


    if (profileReferencia) {

        profileReferencia.textContent =
            values.referencia;
    }

}


/**
 * Preenche formulário de edição.
 */
function fillEditProfile() {

    const data =
        currentClientData || {};


    if (editNome) {

        editNome.value =
            cleanText(
                data.nome,
                currentUser?.displayName ||
                ""
            );
    }


    if (editEmail) {

        editEmail.value =
            cleanText(
                data.email,
                currentUser?.email ||
                ""
            );
    }


    if (editCpf) {

        editCpf.value =
            cleanText(
                data.cpf,
                ""
            );
    }


    if (editNascimento) {

        editNascimento.value =
            normalizeDateInput(
                data.dataNascimento ||
                data.nascimento ||
                ""
            );
    }


    if (editTelefone) {

        editTelefone.value =
            cleanText(
                data.telefone,
                ""
            );
    }


    if (editWhatsapp) {

        editWhatsapp.value =
            cleanText(
                data.whatsapp,
                ""
            );
    }


    if (editCep) {

        editCep.value =
            cleanText(
                data.cep,
                ""
            );
    }


    if (editEndereco) {

        editEndereco.value =
            cleanText(
                data.endereco ||
                data.rua,
                ""
            );
    }


    if (editNumero) {

        editNumero.value =
            cleanText(
                data.numero,
                ""
            );
    }


    if (editComplemento) {

        editComplemento.value =
            cleanText(
                data.complemento,
                ""
            );
    }


    if (editBairro) {

        editBairro.value =
            cleanText(
                data.bairro,
                ""
            );
    }


    if (editCidade) {

        editCidade.value =
            cleanText(
                data.cidade,
                ""
            );
    }


    if (editEstado) {

        editEstado.value =
            cleanText(
                data.estado,
                ""
            );
    }


    if (editReferencia) {

        editReferencia.value =
            cleanText(
                data.referencia,
                ""
            );
    }

}


/**
 * Normaliza data para input date.
 */
function normalizeDateInput(
    value
) {

    if (!value) {
        return "";
    }


    /*
     * Já está YYYY-MM-DD.
     */
    if (
        /^\d{4}-\d{2}-\d{2}$/
            .test(
                String(value)
            )
    ) {

        return String(value);
    }


    /*
     * DD/MM/YYYY.
     */
    const brMatch =
        String(value)
            .match(
                /^(\d{2})\/(\d{2})\/(\d{4})$/
            );


    if (brMatch) {

        return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
    }


    const date =
        timestampToDate(
            value
        );


    if (date) {

        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            )
                .padStart(
                    2,
                    "0"
                );


        const day =
            String(
                date.getDate()
            )
                .padStart(
                    2,
                    "0"
                );


        return `${year}-${month}-${day}`;
    }


    return "";
}


/**
 * Salva edição do perfil.
 */
async function saveProfile() {

    if (!currentUser) {
        return;
    }


    if (
        !editProfileForm
    ) {
        return;
    }


    if (
        !editNome?.value.trim()
    ) {

        showMessage(
            editProfileMessage,
            "Informe seu nome completo.",
            "error"
        );

        return;
    }


    if (saveProfileButton) {

        saveProfileButton.disabled =
            true;

        saveProfileButton.textContent =
            "Salvando...";
    }


    showMessage(
        editProfileMessage,
        "Salvando seus dados...",
        "info"
    );


    try {

        const clientRef =
            doc(
                db,
                CLIENTS_COLLECTION,
                currentUser.uid
            );


        /*
         * Campos controlados pelo cliente.
         *
         * Não alteramos:
         * uid
         * email
         * tipoUsuario
         * status
         * dataCadastro
         * termos
         */
        const updateData = {

            nome:
                cleanText(
                    editNome?.value
                ),

            telefone:
                cleanText(
                    editTelefone?.value
                ),

            whatsapp:
                cleanText(
                    editWhatsapp?.value
                ),

            cep:
                cleanText(
                    editCep?.value
                ),

            endereco:
                cleanText(
                    editEndereco?.value
                ),

            numero:
                cleanText(
                    editNumero?.value
                ),

            complemento:
                cleanText(
                    editComplemento?.value
                ),

            bairro:
                cleanText(
                    editBairro?.value
                ),

            cidade:
                cleanText(
                    editCidade?.value
                ),

            estado:
                cleanText(
                    editEstado?.value
                ),

            referencia:
                cleanText(
                    editReferencia?.value
                )

        };


        /*
         * CPF e nascimento são somente leitura
         * neste painel.
         */
        await updateDoc(
            clientRef,
            updateData
        );


        currentClientData = {

            ...currentClientData,

            ...updateData

        };


        renderProfile();


        showMessage(
            editProfileMessage,
            "Dados atualizados com sucesso.",
            "success"
        );


        setTimeout(
            () => {

                closeEditProfileModal();

            },
            900
        );


    } catch (error) {

        console.error(
            "Erro ao atualizar perfil:",
            error
        );


        let message =
            "Não foi possível salvar seus dados.";


        if (
            error?.code ===
            "permission-denied"
        ) {

            message =
                "O Firebase recusou a atualização. Verifique as regras da coleção clientes.";

        }


        showMessage(
            editProfileMessage,
            message,
            "error"
        );


    } finally {

        if (saveProfileButton) {

            saveProfileButton.disabled =
                false;

            saveProfileButton.textContent =
                "Salvar alterações";
        }

    }
}


/**
 * Abre edição.
 */
function openEditProfileModal() {

    fillEditProfile();


    showMessage(
        editProfileMessage,
        ""
    );


    if (editProfileModal) {

        editProfileModal.hidden =
            false;

        document.body.style.overflow =
            "hidden";
    }
}


/**
 * Fecha edição.
 */
function closeEditProfileModal() {

    if (editProfileModal) {

        editProfileModal.hidden =
            true;
    }


    document.body.style.overflow =
        "";
}


/* ============================================================
   EXCLUSÃO DA CONTA
   ============================================================ */


/**
 * Abre modal de exclusão.
 */
function openDeleteAccountModal() {

    if (
        isProtectedAdmin()
    ) {

        alert(
            "A conta administrativa protegida não pode ser excluída por esta área."
        );

        return;
    }


    if (deleteAccountPassword) {

        deleteAccountPassword.value =
            "";
    }


    showMessage(
        deleteAccountMessage,
        ""
    );


    if (deleteAccountModal) {

        deleteAccountModal.hidden =
            false;

        document.body.style.overflow =
            "hidden";
    }

}


/**
 * Fecha modal.
 */
function closeDeleteAccountModal() {

    if (deleteAccountModal) {

        deleteAccountModal.hidden =
            true;
    }


    document.body.style.overflow =
        "";
}


/**
 * Exclui conta.
 *
 * A exclusão do Auth exige reautenticação
 * para usuários de email/senha.
 */
async function deleteAccount() {

    if (!currentUser) {
        return;
    }


    if (
        isProtectedAdmin()
    ) {

        showMessage(
            deleteAccountMessage,
            "A conta administrativa protegida não pode ser excluída.",
            "error"
        );

        return;
    }


    if (isDeletingAccount) {
        return;
    }


    const password =
        cleanText(
            deleteAccountPassword?.value
        );


    if (!password) {

        showMessage(
            deleteAccountMessage,
            "Digite sua senha para confirmar a exclusão.",
            "error"
        );

        return;
    }


    isDeletingAccount =
        true;


    if (confirmDeleteAccount) {

        confirmDeleteAccount.disabled =
            true;

        confirmDeleteAccount.textContent =
            "Excluindo...";
    }


    showMessage(
        deleteAccountMessage,
        "Confirmando sua identidade...",
        "info"
    );


    try {

        /*
         * Reautenticação.
         */
        const credential =
            EmailAuthProvider.credential(
                currentUser.email,
                password
            );


        await reauthenticateWithCredential(
            currentUser,
            credential
        );


        showMessage(
            deleteAccountMessage,
            "Removendo seu cadastro...",
            "info"
        );


        const userUid =
            currentUser.uid;


        const clientRef =
            doc(
                db,
                CLIENTS_COLLECTION,
                userUid
            );


        /*
         * Primeiro remove o documento do cliente.
         */
        await deleteDoc(
            clientRef
        );


        showMessage(
            deleteAccountMessage,
            "Removendo sua conta de acesso...",
            "info"
        );


        /*
         * Depois remove a conta do Firebase Authentication.
         */
        await deleteUser(
            currentUser
        );


        /*
         * Limpeza local.
         */
        cart = [];

        favorites = [];

        currentClientData = {};

        allProducts = [];

        filteredProducts = [];


        closeDeleteAccountModal();


        alert(
            "Sua conta foi excluída com sucesso."
        );


        /*
         * Auth já deve disparar o estado
         * sem usuário. Mesmo assim fazemos
         * uma saída segura.
         */
        try {

            await signOut(
                auth
            );

        } catch (logoutError) {

            console.warn(
                "Logout após exclusão:",
                logoutError
            );
        }


        window.location.href =
            "index.html";


    } catch (error) {

        console.error(
            "Erro ao excluir conta:",
            error
        );


        let message =
            "Não foi possível excluir a conta.";


        if (
            error?.code ===
            "auth/invalid-credential"
        ) {

            message =
                "Senha incorreta. Confirme sua senha e tente novamente.";

        }

        else if (
            error?.code ===
            "auth/wrong-password"
        ) {

            message =
                "Senha incorreta. Confirme sua senha e tente novamente.";

        }

        else if (
            error?.code ===
            "auth/requires-recent-login"
        ) {

            message =
                "É necessário entrar novamente na conta antes de excluí-la.";

        }

        else if (
            error?.code ===
            "permission-denied"
        ) {

            message =
                "O Firestore recusou a exclusão do cadastro. Verifique as regras da coleção clientes.";

        }

        else if (
            error?.code ===
            "auth/network-request-failed"
        ) {

            message =
                "Falha de conexão. Tente novamente.";

        }


        showMessage(
            deleteAccountMessage,
            message,
            "error"
        );


    } finally {

        isDeletingAccount =
            false;


        if (confirmDeleteAccount) {

            confirmDeleteAccount.disabled =
                false;

            confirmDeleteAccount.textContent =
                "Excluir definitivamente";
        }

    }
}


/* ============================================================
   NAVEGAÇÃO ENTRE SEÇÕES
   ============================================================ */


/**
 * Esconde todos os painéis.
 */
function hideAllSections() {

    if (storeSection) {

        storeSection.hidden =
            true;
    }


    if (favoritesSection) {

        favoritesSection.hidden =
            true;
    }


    if (profileSection) {

        profileSection.hidden =
            true;
    }


    if (ordersSection) {

        ordersSection.hidden =
            true;
    }

    if (offersSection) offersSection.hidden = true;
}


/**
 * Mostra vitrine.
 */
function showStore() {

    hideAllSections();
    setBottomNavigationActive("store");


    if (storeSection) {

        storeSection.hidden =
            false;
    }


    closeMobileMenu();


    window.scrollTo(
        {
            top:
                0,

            behavior:
                "auto"
        }
    );
}


/**
 * Mostra ofertas.
 */
function showOffers(pushHistory = true) {
    hideAllSections();

    if (offersSection) {
        offersSection.hidden = false;
    }

    renderOffers();
    closeMobileMenu();

    if (pushHistory) {
        try {
            const url =
                new URL(window.location.href);

            url.hash = "ofertas";

            window.history.pushState(
                {
                    ...(window.history.state || {}),
                    casafortOffers: true
                },
                "",
                `${url.pathname}${url.search}${url.hash}`
            );
        } catch (error) {
            console.warn(
                "Não foi possível registrar a página de ofertas.",
                error
            );
        }
    }

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}


/**
 * Mostra favoritos.
 */
function showFavorites() {

    hideAllSections();
    setBottomNavigationActive("favorites");


    if (favoritesSection) {

        favoritesSection.hidden =
            false;
    }


    renderFavorites();


    closeMobileMenu();


    window.scrollTo(
        {
            top:
                0,

            behavior:
                "auto"
        }
    );
}


/**
 * Mostra perfil.
 */
function showProfile() {

    hideAllSections();
    setBottomNavigationActive("account");


    if (profileSection) {

        profileSection.hidden =
            false;
    }


    renderProfile();


    closeMobileMenu();


    window.scrollTo(
        {
            top:
                0,

            behavior:
                "auto"
        }
    );
}


/**
 * Mostra pedidos.
 */
async function showOrders() {

    hideAllSections();
    setBottomNavigationActive("orders");


    if (ordersSection) {

        ordersSection.hidden =
            false;
    }


    closeMobileMenu();


    await loadOrders();


    window.scrollTo(
        {
            top:
                0,

            behavior:
                "auto"
        }
    );
}


/* ============================================================
   MENU MOBILE
   ============================================================ */

function openMobileMenu() {

    if (!mobileMenuDropdown) {
        return;
    }


    mobileMenuDropdown.hidden =
        false;


    mobileMenuDropdown.classList.add(
        "open"
    );


    hideMobileCategoryHeader();


    if (mobileMenuButton) {

        mobileMenuButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }
}


function closeMobileMenu() {

    if (!mobileMenuDropdown) {
        return;
    }


    mobileMenuDropdown.hidden =
        true;


    mobileMenuDropdown.classList.remove(
        "open"
    );


    if (mobileMenuButton) {

        mobileMenuButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}


function toggleMobileMenu() {

    if (
        mobileMenuDropdown?.hidden
    ) {

        openMobileMenu();

    } else {

        closeMobileMenu();
    }
}


/* ============================================================
   NAVEGAÇÃO INFERIOR — MOBILE / TABLET
   Os botões do HTML usam data-bottom-action.
   Este listener é deliberadamente delegado no document para
   continuar funcionando mesmo quando seções são redesenhadas.
   ============================================================ */

function setBottomNavigationActive(action) {
    const items = document.querySelectorAll(
        ".casafort-bottom-item[data-bottom-action]"
    );

    items.forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.bottomAction === action
        );
    });
}

function goToHomeStore() {
    /* Fecha qualquer camada que possa impedir o toque seguinte. */
    closeMobileMenu();

    if (productModal && !productModal.hidden) {
        closeProductDetails(true);
    }

    if (cartDrawer && !cartDrawer.hidden) {
        closeCart();
    }

    selectedCategoryId = "";
    filteredProducts = [...allProducts];

    try {
        const url = new URL(window.location.href);
        url.hash = "";
        url.searchParams.delete("ofertas");

        window.history.replaceState(
            {
                ...(window.history.state || {}),
                casafortOffers: false,
                casafortProduct: null
            },
            "",
            `${url.pathname}${url.search}${url.hash}`
        );
    } catch (error) {
        console.warn(
            "Não foi possível limpar o estado da página inicial.",
            error
        );
    }

    showStore();
    renderHomeProducts();
    renderCategoryItems();
    renderCategoryStrip();
    renderProducts();
    updateCategoryPage("");

    setBottomNavigationActive("store");
}

document.addEventListener("click", async event => {
    const item = event.target.closest(
        ".casafort-bottom-item[data-bottom-action]"
    );

    if (!item) return;

    event.preventDefault();
    event.stopPropagation();

    const action = item.dataset.bottomAction;

    try {
        if (action === "store") {
            goToHomeStore();
            return;
        }

        if (action === "favorites") {
            if (productModal && !productModal.hidden) {
                closeProductDetails(true);
            }
            if (cartDrawer && !cartDrawer.hidden) {
                closeCart();
            }
            showFavorites();
            setBottomNavigationActive("favorites");
            return;
        }

        if (action === "cart") {
            closeMobileMenu();
            setBottomNavigationActive("cart");
            openCart();
            return;
        }

        if (action === "orders") {
            if (productModal && !productModal.hidden) {
                closeProductDetails(true);
            }
            if (cartDrawer && !cartDrawer.hidden) {
                closeCart();
            }
            setBottomNavigationActive("orders");
            await showOrders();
            return;
        }

        if (action === "account") {
            if (productModal && !productModal.hidden) {
                closeProductDetails(true);
            }
            if (cartDrawer && !cartDrawer.hidden) {
                closeCart();
            }
            showProfile();
            setBottomNavigationActive("account");
        }
    } catch (error) {
        console.error(
            "Erro na navegação inferior:",
            error
        );
    }
}, false);

/* Ao voltar para a vitrine, mantém o botão Início destacado. */
document.addEventListener("casafort:navigation", event => {
    const action = event.detail?.action;
    if (action) setBottomNavigationActive(action);
});


/* ============================================================
   LOGOUT
   ============================================================ */

async function logout() {

    try {

        await signOut(
            auth
        );


        /*
         * A página de login pode ser:
         * index.html
         *
         * Se seu login tiver outro arquivo,
         * basta alterar aqui.
         */
        window.location.href =
            "index.html";


    } catch (error) {

        console.error(
            "Erro ao sair:",
            error
        );


        alert(
            "Não foi possível sair da conta."
        );
    }
}


/* ============================================================
   CATEGORIAS DINÂMICAS - INICIALIZAÇÃO
   ============================================================ */

injectCategoryStyles();
ensureCategoryContainers();
bindCategoryEvents();


bindCategoryStripEvents();


/* ============================================================
   AUTENTICAÇÃO
   ============================================================ */

async function initializeUser(
    user
) {

    currentUser =
        user;


    /*
     * Começa os produtos em paralelo ao carregamento do perfil.
     * Isso evita que a vitrine fique esperando o perfil terminar.
     */
    const categoriesPromise =
        loadCategories();

    const productsPromise =
        loadProducts();

    const marketingPromise =
        loadMarketingBanners();

    const footerPromise =
        loadFooterSettings();


    /*
     * Carrega documento do cliente.
     */
    try {

        currentClientData =
            await loadClientData(
                user
            );

    } catch (error) {

        console.error(
            "Erro ao carregar cliente:",
            error
        );


        currentClientData = {

            uid:
                user.uid,

            email:
                user.email || "",

            nome:
                user.displayName || ""

        };
    }


    /*
     * Favoritos.
     */
    loadFavoritesFromClient();


    /*
     * Carrinho.
     */
    loadCartFromClient();


    /*
     * Perfil.
     */
    renderProfile();


    /*
     * Carrinho.
     */
    renderCart();


    /*
     * Garante que a primeira carga dos produtos terminou.
     */
    await categoriesPromise;
    await productsPromise;
    await marketingPromise;
    await footerPromise;

    const urlCategoryId =
        getCategoryIdFromUrl();

    if (urlCategoryId) {
        selectedCategoryId =
            urlCategoryId;

        filteredProducts =
            allProducts.filter(
                product =>
                    String(
                        getProductCategoryId(
                            product
                        )
                    ) === selectedCategoryId
            );

        renderCategoryItems();
        renderProducts();
        updateCategoryPage(
            selectedCategoryId
        );
    } else {
        selectedCategoryId = "";
        filteredProducts =
            [...allProducts];

        renderCategoryItems();
        renderProducts();
        updateCategoryPage("");
    }


    /*
     * Depois dos produtos carregados,
     * atualizamos favoritos e carrinho
     * com os preços/imagens atuais.
     */
    cart =
        cart.map(
            item =>
                normalizeCartItem(
                    item
                )
        )
        .filter(Boolean);


    renderCart();

    renderFavorites();


    /*
     * Inicialmente a vitrine fica aberta.
     */
    showStore();

}


/* ============================================================
   EVENTOS - VITRINE
   ============================================================ */

/* ============================================================
   PESQUISA - GARANTIR CAMPO SEMPRE VAZIO
   ============================================================ */

function clearProductSearch() {

    if (!productSearch) {
        return;
    }

    productSearch.value = "";

    productSearch.removeAttribute("value");

}


/*
 * Limpa imediatamente.
 */
clearProductSearch();


/*
 * Limpa novamente após o navegador tentar
 * preencher automaticamente o campo.
 */
setTimeout(
    clearProductSearch,
    100
);

setTimeout(
    clearProductSearch,
    500
);

setTimeout(
    clearProductSearch,
    1000
);


if (productSearch) {

    productSearch.addEventListener(
        "input",
        searchProducts
    );


    productSearch.addEventListener(
        "search",
        searchProducts
    );


    /*
     * Impede que o preenchimento automático
     * mantenha o e-mail dentro da pesquisa.
     */
    productSearch.addEventListener(
        "focus",
        () => {

            /*
             * Só limpa se o campo ainda estiver
             * com um possível e-mail.
             */
            const value =
                String(
                    productSearch.value || ""
                ).trim();

            if (
                value.includes("@")
            ) {

                productSearch.value = "";

                searchProducts();
            }

        }
    );
}
if (searchClear) {

    searchClear.addEventListener(
        "click",
        () => {

            if (productSearch) {

                productSearch.value =
                    "";
            }


            searchProducts();


            productSearch?.focus();

        }
    );
}


/* ============================================================
   EVENTOS - CLIQUE NOS PRODUTOS
   ============================================================ */

/*
 * Clique no próprio card do produto.
 * Qualquer área livre do card abre os detalhes.
 * Os botões internos mantêm suas ações normais.
 */
document.addEventListener(
    "click",
    event => {
        const card =
            event.target.closest(
                ".shop-product-card[data-product-id]"
            );

        if (!card) return;

        const interactive =
            event.target.closest(
                "button, a, input, select, textarea"
            );

        if (interactive) return;

        const productId = card.dataset.productId;
        if (!productId) return;

        event.preventDefault();
        openProductDetails(productId);
    }
);

document.addEventListener(
    "click",
    async event => {

        const actionElement =
            event.target.closest(
                "[data-action]"
            );


        if (!actionElement) {
            return;
        }


        const action =
            actionElement.dataset.action;


        const productId =
            actionElement.dataset.productId;


        if (!productId) {
            return;
        }


        if (
            action ===
            "details"
        ) {

            openProductDetails(
                productId
            );

            return;
        }


        if (
            action ===
            "favorite"
        ) {

            await toggleFavorite(
                productId
            );

            return;
        }


        if (
            action ===
            "add"
        ) {

            await addToCart(
                productId,
                1
            );

            return;
        }

    }
);


/* ============================================================
   EVENTOS - PRODUTOS RELACIONADOS
   ============================================================ */

if (relatedProductsPrev) {
    relatedProductsPrev.addEventListener(
        "click",
        event => {
            event.preventDefault();
            event.stopPropagation();
            scrollRelatedProducts(-1);
        }
    );
}

if (relatedProductsNext) {
    relatedProductsNext.addEventListener(
        "click",
        event => {
            event.preventDefault();
            event.stopPropagation();
            scrollRelatedProducts(1);
        }
    );
}

if (relatedProductsTrack) {
    relatedProductsTrack.addEventListener(
        "scroll",
        updateRelatedProductsArrows,
        { passive: true }
    );
}

window.addEventListener(
    "resize",
    () => {
        if (productModal && !productModal.hidden) {
            updateRelatedProductsArrows();
        }
    }
);

/* ============================================================
   EVENTOS - GALERIA
   ============================================================ */

if (detailThumbs) {

    detailThumbs.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-detail-image-index]"
                );


            if (!button) {
                return;
            }


            const index =
                Number(
                    button.dataset
                        .detailImageIndex
                );


            if (
                !Number.isInteger(
                    index
                )
            ) {
                return;
            }


            if (
                index <
                0 ||
                index >=
                currentProductImages.length
            ) {
                return;
            }


            currentProductImageIndex =
                index;


            renderDetailGallery();

        }
    );
}


/* ============================================================
   EVENTOS - QUANTIDADE NO DETALHE
   ============================================================ */

if (detailQuantityMinus) {

    detailQuantityMinus.addEventListener(
        "click",
        () => {

            currentDetailQuantity =
                Math.max(
                    1,
                    currentDetailQuantity - 1
                );


            if (detailQuantity) {

                detailQuantity.value =
                    String(
                        currentDetailQuantity
                    );
            }

        }
    );
}


if (detailQuantityPlus) {

    detailQuantityPlus.addEventListener(
        "click",
        () => {

            if (!currentProduct) {
                return;
            }


            const max =
                currentProduct.temEstoque
                    ? currentProduct.estoque
                    : Infinity;


            currentDetailQuantity =
                Math.min(
                    max,
                    currentDetailQuantity + 1
                );


            if (
                currentProduct.temEstoque &&
                currentProduct.estoque <= 0
            ) {

                currentDetailQuantity =
                    1;
            }


            if (detailQuantity) {

                detailQuantity.value =
                    String(
                        currentDetailQuantity
                    );
            }

        }
    );
}


if (detailQuantity) {

    detailQuantity.addEventListener(
        "input",
        () => {

            let value =
                Math.floor(
                    toNumber(
                        detailQuantity.value
                    )
                );


            if (
                !Number.isFinite(
                    value
                ) ||
                value < 1
            ) {

                value =
                    1;
            }


            if (
                currentProduct?.temEstoque
            ) {

                value =
                    Math.min(
                        value,
                        currentProduct.estoque
                    );
            }


            currentDetailQuantity =
                value;


            detailQuantity.value =
                String(value);

        }
    );
}


/* ============================================================
   EVENTO - ADICIONAR PELO DETALHE
   ============================================================ */

if (detailAddButton) {

    detailAddButton.addEventListener(
        "click",
        async () => {

            if (!currentProduct) {
                return;
            }


            const quantity =
                Math.max(
                    1,
                    Math.floor(
                        toNumber(
                            detailQuantity?.value
                        )
                    )
                );


            await addToCart(
                currentProduct.id,
                quantity
            );


            showMessage(
                detailMessage,
                `${currentProduct.nome} foi adicionado ao carrinho.`,
                "success"
            );

        }
    );
}


/* ============================================================
   EVENTOS - FECHAR MODAL PRODUTO
   ============================================================ */

if (closeProductModal) {

    closeProductModal.addEventListener(
        "click",
        closeProductDetails
    );
}


if (productModal) {

    productModal.addEventListener(
        "click",
        event => {

            /* Somente a área externa/escura fecha o detalhe.
               Tudo dentro do produto continua utilizável. */
            if (event.target === productModal) {
                closeProductDetails();
            }

        }
    );
}

/*
 * Voltar do navegador/Android/iOS/desktop:
 * se o detalhe estiver aberto, fecha o detalhe em vez
 * de abandonar a página do cliente.
 */
window.addEventListener(
    "popstate",
    event => {

        if (
            productModal &&
            !productModal.hidden &&
            !event.state?.casafortProduct
        ) {
            closingProductModalFromHistory = true;
            closeProductDetails(true);
            return;
        }

        if (
            productModal &&
            !productModal.hidden &&
            event.state?.casafortProduct
        ) {
            const productId =
                String(event.state.casafortProduct);

            if (
                currentProduct?.id !== productId
            ) {
                openProductDetails(productId);
            }
        }
    }
);


/* ============================================================
   EVENTOS - NAVEGAÇÃO
   ============================================================ */

if (favoritesButton) {

    favoritesButton.addEventListener(
        "click",
        showFavorites
    );
}


if (accountButton) {

    accountButton.addEventListener(
        "click",
        showProfile
    );
}


if (backToStoreFromFavorites) {

    backToStoreFromFavorites.addEventListener(
        "click",
        showStore
    );
}


if (backToStoreFromProfile) {

    backToStoreFromProfile.addEventListener(
        "click",
        showStore
    );
}


if (backToStoreFromOrders) {

    backToStoreFromOrders.addEventListener(
        "click",
        showStore
    );
}


/* ============================================================
   EVENTOS - CARRINHO
   ============================================================ */

if (cartButton) {

    cartButton.addEventListener(
        "click",
        openCart
    );
}


if (closeCartButton) {

    closeCartButton.addEventListener(
        "click",
        closeCart
    );
}


if (cartOverlay) {

    cartOverlay.addEventListener(
        "click",
        closeCart
    );
}


/* ============================================================
   EVENTOS INTERNOS DO CARRINHO
   ============================================================ */

if (cartItems) {

    cartItems.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "[data-cart-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.cartAction;


            const productId =
                button.dataset.productId;


            if (!productId) {
                return;
            }


            if (
                action ===
                "increase"
            ) {

                await increaseCartItem(
                    productId
                );

                return;
            }


            if (
                action ===
                "decrease"
            ) {

                await decreaseCartItem(
                    productId
                );

                return;
            }


            if (
                action ===
                "remove"
            ) {

                await removeCartItem(
                    productId
                );

                return;
            }

        }
    );


    cartItems.addEventListener(
        "change",
        async event => {

            const checkbox =
                event.target.closest(
                    ".cart-item-select"
                );


            if (
                checkbox
            ) {

                await toggleCartSelection(
                    checkbox.dataset.productId,
                    checkbox.checked
                );

                return;
            }


            if (
                event.target.id ===
                "selectAllCart"
            ) {

                const checked =
                    event.target.checked;


                cart.forEach(
                    item => {

                        item.selected =
                            checked;

                    }
                );


                renderCart();

                return;
            }

        }
    );


    cartItems.addEventListener(
        "click",
        async event => {

            if (
                event.target.id ===
                "deleteSelectedCart"
            ) {

                await deleteSelectedCartItems();
            }

        }
    );
}


/* ============================================================
   FRETE
   ============================================================ */

if (cartDeliveryCep) {
    cartDeliveryCep.addEventListener(
        "input",
        () => {
            const formatted =
                formatDeliveryCep(
                    cartDeliveryCep.value
                );

            cartDeliveryCep.value =
                formatted;

            /*
             * Se o CEP mudar depois de uma cotação,
             * a cotação antiga deixa de valer.
             */
            const normalized =
                normalizeDeliveryCep(
                    formatted
                );

            if (
                normalized !==
                deliveryCep
            ) {
                deliveryCalculated = false;
                deliveryCost = null;

                if (cartDeliveryCost) {
                    cartDeliveryCost.textContent =
                        "Calcule seu frete";
                }

                setCartDeliveryMessage("");
                updateCartSummary();
            }
        }
    );

    cartDeliveryCep.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Enter"
            ) {
                event.preventDefault();

                calculateCartDelivery();
            }
        }
    );
}

if (calculateDeliveryButton) {
    calculateDeliveryButton.addEventListener(
        "click",
        calculateCartDelivery
    );
}


/* ============================================================
   CHECKOUT
   ============================================================ */

if (checkoutButton) {

    checkoutButton.addEventListener(
        "click",
        async () => {

            await finalizarCompra();

        }
    );
}


/* ============================================================
   EVENTOS - PERFIL
   ============================================================ */

if (editProfileButton) {

    editProfileButton.addEventListener(
        "click",
        openEditProfileModal
    );
}


if (closeEditProfile) {

    closeEditProfile.addEventListener(
        "click",
        closeEditProfileModal
    );
}


if (cancelEditProfile) {

    cancelEditProfile.addEventListener(
        "click",
        closeEditProfileModal
    );
}


if (editProfileForm) {

    editProfileForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            await saveProfile();

        }
    );
}


/* ============================================================
   EVENTOS - EXCLUSÃO
   ============================================================ */

if (deleteAccountButton) {

    deleteAccountButton.addEventListener(
        "click",
        openDeleteAccountModal
    );
}


if (closeDeleteAccount) {

    closeDeleteAccount.addEventListener(
        "click",
        closeDeleteAccountModal
    );
}


if (cancelDeleteAccount) {

    cancelDeleteAccount.addEventListener(
        "click",
        closeDeleteAccountModal
    );
}


if (confirmDeleteAccount) {

    confirmDeleteAccount.addEventListener(
        "click",
        deleteAccount
    );
}


if (deleteAccountModal) {

    deleteAccountModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                deleteAccountModal
            ) {

                closeDeleteAccountModal();
            }

        }
    );
}


/* ============================================================
   EVENTOS - MENU MOBILE
   ============================================================ */

if (mobileMenuButton) {

    mobileMenuButton.addEventListener(
        "click",
        event => {
            event.preventDefault();
            event.stopPropagation();

            if (!mobileMenuDropdown) {
                return;
            }

            const isOpen =
                mobileMenuButton.getAttribute("aria-expanded") === "true";

            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        }
    );
}


if (mobileMenuDropdown) {

    mobileMenuDropdown.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "[data-mobile-action]"
                );


            if (!button) {
                return;
            }


            const action =
                button.dataset.mobileAction;


            if (
                action ===
                "store"
            ) {

                showStore();

            }

            else if (
                action ===
                "offers"
            ) {
                showOffers();
            }

            else if (
                action ===
                "favorites"
            ) {

                showFavorites();

            }

            else if (
                action ===
                "profile"
            ) {

                showProfile();

            }

            else if (
                action ===
                "orders"
            ) {

                await showOrders();

            }

            else if (
                action ===
                "cart"
            ) {

                closeMobileMenu();

                openCart();

            }

            else if (
                action ===
                "logout"
            ) {

                await logout();

            }

        }
    );
}


/* ============================================================
   NAVEGAÇÃO DE OFERTAS
   ============================================================ */
if (offersButton) {
    offersButton.addEventListener(
        "click",
        event => {
            event.preventDefault();
            event.stopPropagation();
            showOffers();
        }
    );
}

if (offersBackButton) {
    offersBackButton.addEventListener(
        "click",
        event => {
            event.preventDefault();
            event.stopPropagation();

            selectedCategoryId = "";
            filteredProducts = [...allProducts];

            try {
                const url =
                    new URL(window.location.href);
                url.searchParams.delete("ofertas");
                if (url.hash === "#ofertas") {
                    url.hash = "";
                }

                window.history.replaceState(
                    {
                        ...(window.history.state || {}),
                        casafortOffers: false
                    },
                    "",
                    `${url.pathname}${url.search}${url.hash}`
                );
            } catch (error) {
                console.warn(
                    "Não foi possível limpar o estado de ofertas.",
                    error
                );
            }

            showStore();
            renderCategoryItems();
            renderCategoryStrip();
            renderProducts();
            updateCategoryPage("");
        }
    );
}


/* ============================================================
   LOGOUT DESKTOP
   ============================================================ */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logout
    );
}


/* ============================================================
   HOME / MARCA
   ============================================================ */

const brandHome =
    $("brandHome");

if (brandHome) {
    brandHome.addEventListener(
        "click",
        event => {
            /*
             * O href="./cliente.html" é o fallback nativo.
             * Quando o JS está ativo, a navegação é feita sem
             * perder o estado da vitrine já carregada.
             */
            event.preventDefault();
            event.stopPropagation();

            goToHomeStore();
        },
        false
    );
}

document.addEventListener("DOMContentLoaded", () => {
    setBottomNavigationActive(
        storeSection && !storeSection.hidden
            ? "store"
            : ""
    );
});

/* ============================================================
   CLIQUE FORA DO MENU MOBILE
   ============================================================ */

document.addEventListener(
    "click",
    event => {

        if (!mobileMenuDropdown) {
            return;
        }


        if (
            mobileMenuDropdown.hidden
        ) {
            return;
        }


        const clickedInside =
            mobileMenuDropdown.contains(
                event.target
            );


        const clickedButton =
            mobileMenuButton?.contains(
                event.target
            );


        if (
            !clickedInside &&
            !clickedButton
        ) {

            closeMobileMenu();
        }

    }
);


/* ============================================================
   TECLADO
   ============================================================ */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            if (
                productModal &&
                !productModal.hidden
            ) {

                closeProductDetails();

                return;
            }


            if (
                editProfileModal &&
                !editProfileModal.hidden
            ) {

                closeEditProfileModal();

                return;
            }


            if (
                deleteAccountModal &&
                !deleteAccountModal.hidden
            ) {

                closeDeleteAccountModal();

                return;
            }


            if (
                cartDrawer &&
                !cartDrawer.hidden
            ) {

                closeCart();

                return;
            }


            closeMobileMenu();

        }

    }
);


/* ============================================================
   AUTENTICAÇÃO
   ============================================================ */

onAuthStateChanged(
    auth,
    async user => {

        /*
         * Sem usuário:
         * manda para login.
         */
        if (!user) {

            currentUser =
                null;

            currentClientData =
                {};

            cart =
                [];

            favorites =
                [];

            /*
             * Evita loop caso já esteja
             * na própria página de login.
             */
            if (
                !location.pathname
                    .toLowerCase()
                    .endsWith(
                        "index.html"
                    )
            ) {

                window.location.href =
                    "index.html";
            }

            return;
        }


        try {

            await initializeUser(
                user
            );


        } catch (error) {

            console.error(
                "Erro ao inicializar área do cliente:",
                error
            );


            if (productsGrid) {

                productsGrid.innerHTML = `

                    <div class="shop-empty">

                        <strong>
                            Não foi possível carregar a loja.
                        </strong>

                        <span>
                            Atualize a página e tente novamente.
                        </span>

                    </div>

                `;
            }

        }

    }
);


/* ============================================================
   RODAPÉ DINÂMICO — ADMIN -> CLIENTE
   ============================================================ */

const FOOTER_DOCUMENT_PATH = ["configuracoes", "rodape"];

function footerHref(value, label = "") {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const normalizedLabel = String(label).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (normalizedLabel.includes("whatsapp")) { const n = raw.replace(/\D/g, ""); return n ? `https://wa.me/${n}` : ""; }
    if (normalizedLabel.includes("telefone") || normalizedLabel === "tel") { const n = raw.replace(/\D/g, ""); return n ? `tel:${n}` : ""; }
    if (normalizedLabel.includes("e-mail") || normalizedLabel === "email" || normalizedLabel === "mail") { const e = raw.replace(/^mailto:/i, "").trim(); return e ? `mailto:${e}` : ""; }
    if (/^mailto:|^tel:/i.test(raw)) return raw;
    try { const u = new URL(raw); return ["http:", "https:"].includes(u.protocol) ? u.href : ""; } catch { return ""; }
}

function socialIconSvg(key) {
    const common =
        'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';

    switch (key) {
        case "instagram":
            return `<svg ${common}><rect x="3" y="3" width="18" height="18" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle class="cf-social-fill" cx="17.4" cy="6.6" r="1.1"></circle></svg>`;

        case "facebook":
            return `<svg ${common}><path class="cf-social-fill" d="M13.4 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.5-1.5h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.1v3h2.8v8h3.5Z"></path></svg>`;

        case "tiktok":
            return `<svg ${common}><path class="cf-social-fill" d="M14.2 3h3c.3 1.9 1.4 3.3 3.2 4.1v3.1c-1.2-.1-2.3-.5-3.2-1.1v5.9c0 3.5-2.4 6-6 6-3.1 0-5.4-2.2-5.4-5.1 0-3.2 2.5-5.4 5.9-5.4.4 0 .8 0 1.1.1v3.2c-.3-.1-.7-.2-1.1-.2-1.4 0-2.5.9-2.5 2.2 0 1.2.9 2.1 2.2 2.1 1.5 0 2.8-1 2.8-3.1V3Z"></path></svg>`;

        case "youtube":
            return `<svg ${common}><path d="M21 8.2a2.7 2.7 0 0 0-1.9-1.9C17.4 5.8 12 5.8 12 5.8s-5.4 0-7.1.5A2.7 2.7 0 0 0 3 8.2 28 28 0 0 0 2.6 12 28 28 0 0 0 3 15.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.1.5 7.1.5s5.4 0 7.1-.5a2.7 2.7 0 0 0 1.9-1.9 28 28 0 0 0 .4-3.8 28 28 0 0 0-.4-3.8Z"></path><path class="cf-social-fill" d="m10.3 9 5 3-5 3V9Z"></path></svg>`;

        case "pinterest":
            return `<svg ${common}><path class="cf-social-fill" d="M12 3.2a8.8 8.8 0 0 0-3.2 17c-.1-1.4 0-2.6.4-3.8l1-4.2s-.3-.7-.3-1.7c0-1.6.9-2.8 2.2-2.8 1 0 1.5.8 1.5 1.7 0 1-.6 2.5-.9 3.9-.3 1.2.6 2.2 1.8 2.2 2.2 0 3.9-2.3 3.9-5.7 0-3-2.2-5.1-5.3-5.1-3.6 0-5.8 2.7-5.8 5.5 0 1.1.4 2.3 1 2.9.1.1.1.2.1.4l-.4 1.5c-.1.5-.5.6-.9.4-1.6-.7-2.6-2.8-2.6-4.9 0-4 2.9-7.6 8.4-7.6 4.4 0 7.8 3.1 7.8 7.2 0 4.3-2.7 7.8-6.5 7.8-1.3 0-2.6-.7-3-1.5l-.8 3.1c-.3 1.1-.9 2.5-1.3 3.3.9.3 1.9.4 2.9.4 4.9 0 8.8-4 8.8-8.8A8.8 8.8 0 0 0 12 3.2Z"></path></svg>`;

        case "whatsapp":
            return `<svg ${common}><path d="M20.4 3.6A11.8 11.8 0 0 0 12 0 11.9 11.9 0 0 0 1.7 17.8L0 24l6.4-1.7A11.9 11.9 0 0 0 24 12c0-3.2-1.2-6.2-3.6-8.4Z"></path><path class="cf-social-fill" d="M7.1 5.9c.3-.7.7-.7 1.2-.7h.7c.2 0 .5.1.6.4l1 2.4c.1.3.1.6-.1.8l-.8 1c.6 1.2 1.6 2.3 2.8 2.9l.9-.8c.2-.2.5-.3.8-.1l2.4 1.1c.3.1.4.4.4.6v.7c0 .5 0 .9-.7 1.2-.6.3-2.1.5-4.4-.5-2.8-1.2-4.8-4.1-5-4.4-.2-.3-1.1-1.8-.9-3.6.1-.9.5-1.5 1.1-2Z"></path></svg>`;

        case "telegram":
            return `<svg ${common}><path class="cf-social-fill" d="m21.6 3.1-3 17.7c-.2 1.3-.9 1.6-1.8 1l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 14.3l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6L20.5 4c.9-.3 1.6-.2 1.1-.9Z"></path></svg>`;

        default:
            return `<svg ${common}><circle cx="12" cy="12" r="8"></circle></svg>`;
    }
}

function renderFooter(data) {
    if (!siteFooter) return;

    const identidade =
        data?.identidade || {};

    const legais =
        data?.informacoesLegais || {};

    const inferior =
        data?.rodapeInferior || {};

    const colunas =
        Array.isArray(data?.colunas)
            ? data.colunas.slice(0, 3)
            : [];

    const redes =
        data?.redesSociais || {};

    const socialKeys = [
        "instagram",
        "tiktok",
        "youtube",
        "pinterest",
        "facebook",
        "whatsapp",
        "telegram"
    ];

    const socials =
        socialKeys
            .map(key => {
                const item =
                    redes[key] || {};

                if (
                    item.ativo === false ||
                    !item.url
                ) {
                    return "";
                }

                const href =
                    footerHref(
                        item.url,
                        key
                    );

                if (!href) {
                    return "";
                }

                const label =
                    key.charAt(0).toUpperCase() +
                    key.slice(1);

                return `
                    <a
                        class="shop-footer-social"
                        href="${escapeHtml(href)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="${escapeHtml(label)}"
                        title="${escapeHtml(label)}"
                    >
                        ${socialIconSvg(key)}
                    </a>
                `;
            })
            .join("");

    const columns =
        colunas
            .map(col => {
                const links =
                    Array.isArray(col.links)
                        ? col.links.slice(0, 6)
                        : [];

                const linksHtml =
                    links
                        .map(link => {
                            const label =
                                cleanText(
                                    link?.label
                                );

                            const href =
                                footerHref(
                                    link?.url,
                                    label
                                );

                            if (!label) {
                                return "";
                            }

                            if (href) {
                                const external =
                                    /^https?:/i.test(
                                        href
                                    );

                                return `
                                    <a
                                        class="shop-footer-link"
                                        href="${escapeHtml(href)}"
                                        ${external ? 'target="_blank" rel="noopener noreferrer"' : ""}
                                    >
                                        ${escapeHtml(label)}
                                    </a>
                                `;
                            }

                            return `
                                <span class="shop-footer-link">
                                    ${escapeHtml(label)}
                                </span>
                            `;
                        })
                        .join("");

                if (!linksHtml && !cleanText(col.title)) {
                    return "";
                }

                return `
                    <div class="shop-footer-column">
                        <h3 class="shop-footer-column-title">
                            ${escapeHtml(col.title || "")}
                        </h3>

                        <div class="shop-footer-links">
                            ${linksHtml}
                        </div>
                    </div>
                `;
            })
            .join("");

    siteFooter.innerHTML = `
        <div class="shop-footer-main">
            <div class="container shop-footer-grid">

                <div class="shop-footer-brand-area">

                    ${
                        identidade.logo
                            ? `
                                <img
                                    class="shop-footer-logo"
                                    src="${escapeHtml(identidade.logo)}"
                                    alt="${escapeHtml(identidade.nome || "CasaFort")}"
                                    loading="lazy"
                                >
                              `
                            : ""
                    }

                    ${
                        identidade.nome
                            ? `
                                <h2 class="shop-footer-brand-name">
                                    ${escapeHtml(identidade.nome)}
                                </h2>
                              `
                            : ""
                    }

                    ${
                        identidade.descricao
                            ? `
                                <p class="shop-footer-description">
                                    ${escapeHtml(identidade.descricao)}
                                </p>
                              `
                            : ""
                    }

                    ${
                        socials
                            ? `
                                <div
                                    class="shop-footer-socials"
                                    aria-label="Redes sociais"
                                >
                                    <div class="shop-footer-social-title">Siga nossos perfis</div>
                                    ${socials}
                                </div>
                              `
                            : ""
                    }

                </div>

                ${columns}

            </div>
        </div>

        <div class="shop-footer-legal">

            <div class="container">

                ${
                    legais.cnpj
                        ? `<div>${escapeHtml(legais.cnpj)}</div>`
                        : ""
                }

                ${
                    legais.razaoSocial
                        ? `<div>${escapeHtml(legais.razaoSocial)}</div>`
                        : ""
                }

                ${
                    legais.endereco ||
                    legais.cidadeEstado
                        ? `
                            <div>
                                ${escapeHtml(
                                    legais.endereco || ""
                                )}
                                ${
                                    legais.cidadeEstado
                                        ? ` — ${escapeHtml(legais.cidadeEstado)}`
                                        : ""
                                }
                            </div>
                          `
                        : ""
                }

                ${
                    legais.texto
                        ? `
                            <p>
                                ${escapeHtml(legais.texto)}
                            </p>
                          `
                        : ""
                }

                ${
                    inferior.texto ||
                    identidade.copyright
                        ? `
                            <p>
                                ${escapeHtml(
                                    inferior.texto ||
                                    identidade.copyright ||
                                    ""
                                )}
                            </p>
                          `
                        : ""
                }

                ${
                    inferior.desenvolvidoPor
                        ? `
                            <p>
                                ${escapeHtml(
                                    inferior.desenvolvidoPor
                                )}
                            </p>
                          `
                        : ""
                }

            </div>

        </div>
    `;
}

async function loadFooterSettings() {
    if (!siteFooter) return;
    try { const snap = await getDoc(doc(db, FOOTER_DOCUMENT_PATH[0], FOOTER_DOCUMENT_PATH[1])); renderFooter(snap.exists() ? (snap.data() || {}) : {}); }
    catch (error) { console.error("Erro ao carregar rodapé:", error); renderFooter({}); }
}


/* ============================================================
   COMPATIBILIDADE GLOBAL
   ============================================================ */


/*
 * Compatibilidade com o código antigo.
 */
window.finalizarCompra =
    finalizarCompra;


/*
 * Funções úteis caso algum componente
 * externo ainda as utilize.
 */
window.openProductDetails =
    openProductDetails;


window.addToCart =
    addToCart;


window.toggleFavorite =
    toggleFavorite;


window.openCart =
    openCart;


window.closeCart =
    closeCart;


/* ============================================================
   FIM
   ============================================================ */
/* ============================================================
   PROTEÇÃO DA BUSCA CONTRA PREENCHIMENTO DE E-MAIL
   ============================================================ */

(function protegerBuscaContraEmail() {

    function configurarBusca() {

        const campo = document.getElementById("productSearch");

        if (!campo) {
            return;
        }

        // Mantém a busca vazia ao carregar
        campo.value = "";

        // Impede o navegador de tratar o campo como credencial
        campo.setAttribute("autocomplete", "one-time-code");
        campo.setAttribute("data-lpignore", "true");
        campo.setAttribute("data-form-type", "other");
        campo.setAttribute("data-1p-ignore", "true");

        function liberarBusca() {

            // Libera a digitação
            campo.removeAttribute("readonly");

            // Se o navegador tentou colocar um e-mail,
            // apaga imediatamente.
            if (
                campo.value &&
                campo.value.includes("@")
            ) {
                campo.value = "";
            }
        }

        // Libera quando tocar/clicar
        campo.addEventListener(
            "pointerdown",
            liberarBusca,
            true
        );

        campo.addEventListener(
            "mousedown",
            liberarBusca,
            true
        );

        campo.addEventListener(
            "touchstart",
            liberarBusca,
            true
        );

        campo.addEventListener(
            "focus",
            liberarBusca,
            true
        );

        campo.addEventListener(
            "input",
            function () {

                if (
                    campo.value &&
                    campo.value.includes("@")
                ) {
                    campo.value = "";

                    campo.dispatchEvent(
                        new Event("input", {
                            bubbles: true
                        })
                    );
                }

            },
            true
        );

        // Proteção extra contra preenchimento automático
        // feito pelo navegador depois de alguns milissegundos.
        setTimeout(() => {

            if (
                campo.value &&
                campo.value.includes("@")
            ) {
                campo.value = "";
            }

        }, 100);

        setTimeout(() => {

            if (
                campo.value &&
                campo.value.includes("@")
            ) {
                campo.value = "";
            }

        }, 500);

        setTimeout(() => {

            if (
                campo.value &&
                campo.value.includes("@")
            ) {
                campo.value = "";
            }

        }, 1000);

    }

    // Tenta configurar quando a página estiver pronta
    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            configurarBusca
        );

    } else {

        configurarBusca();

    }

})();
