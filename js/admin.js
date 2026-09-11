// =========================================================
// PAINEL ADMINISTRATIVO
// =========================================================
// Clientes + Produtos + Pedidos
// Firebase Authentication + Firestore
// =========================================================

import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    auth,
    db
} from "./firebase-config.js";

// =========================================================
// ELEMENTOS
// =========================================================

const totalClients =
    document.getElementById("totalClients");

const totalProducts =
    document.getElementById("totalProducts");

const totalOrders =
    document.getElementById("totalOrders");

const clientsTableBody =
    document.getElementById("clientsTableBody");

const clientSearch =
    document.getElementById("clientSearch");

const adminMessage =
    document.getElementById("adminMessage");

const adminLogoutButton =
    document.getElementById("adminLogoutButton");

const productMessage =
    document.getElementById("productMessage");

const productForm =
    document.getElementById("productForm");

const productTitle =
    document.getElementById("productTitle");

const productDescription =
    document.getElementById("productDescription");

const productPrice =
    document.getElementById("productPrice");

const productStock =
    document.getElementById("productStock");

const productImage1 =
    document.getElementById("productImage1");

const productImage2 =
    document.getElementById("productImage2");

const productImage3 =
    document.getElementById("productImage3");

const productActive =
    document.getElementById("productActive");

const productSponsored =
    document.getElementById("productSponsored");

const productMostViewed =
    document.getElementById("productMostViewed");

const productYouMayLike =
    document.getElementById("productYouMayLike");

const productBestSelling =
    document.getElementById("productBestSelling");

const productOffer =
    document.getElementById("productOffer");

const productOfferPercent =
    document.getElementById("productOfferPercent");

const productCategory =
    document.getElementById("productCategory");

const newCategoryButton =
    document.getElementById("newCategoryButton");

const newCategoryFromProduct =
    document.getElementById("newCategoryFromProduct");

const adminCategoriesList =
    document.getElementById("adminCategoriesList");

const adminCategoryProducts =
    document.getElementById("adminCategoryProducts");

const adminCategoryProductsTitle =
    document.getElementById("adminCategoryProductsTitle");

const adminCategoryProductsBody =
    document.getElementById("adminCategoryProductsBody");

const adminCategoryBackButton =
    document.getElementById("adminCategoryBackButton");

const newCategoryModal =
    document.getElementById("newCategoryModal");

const newCategoryName =
    document.getElementById("newCategoryName");

const newCategoryMessage =
    document.getElementById("newCategoryMessage");

const cancelNewCategory =
    document.getElementById("cancelNewCategory");

const saveNewCategory =
    document.getElementById("saveNewCategory");

const marketingMessage =
    document.getElementById("marketingMessage");

const saveMarketingButton =
    document.getElementById("saveMarketingButton");

const marketingInputs =
    Array.from(
        document.querySelectorAll("[data-marketing-slot]")
    );

// =========================================================
// DADOS
// =========================================================

let clients = [];
let products = [];
let orders = [];
let categories = [];

let editingProductId = null;
let selectedCategoryId = null;


// =========================================================
// MENSAGENS
// =========================================================

function showMessage(
    message,
    type = "error"
) {

    if (!adminMessage) {
        return;
    }

    adminMessage.textContent =
        message;

    adminMessage.style.color =
        type === "success"
            ? "#15803d"
            : "#dc2626";
}


function showProductMessage(
    message,
    type = "error"
) {

    if (!productMessage) {
        return;
    }

    productMessage.textContent =
        message;

    productMessage.style.color =
        type === "success"
            ? "#15803d"
            : "#dc2626";
}


// =========================================================
// SEGURANÇA HTML
// =========================================================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


// =========================================================
// MARKETINK / PUBLICIDADE
// =========================================================

const MARKETING_DOCUMENT_PATH = ["marketing", "banners"];

function showMarketingMessage(message, type = "error") {
    if (!marketingMessage) return;
    marketingMessage.textContent = message;
    marketingMessage.style.color = type === "success" ? "#15803d" : "#dc2626";
}

function getMarketingInputs(slot) {
    return Array.from(
        document.querySelectorAll(`[data-marketing-slot="${slot}"]`)
    ).sort(
        (a, b) => Number(a.dataset.marketingIndex) - Number(b.dataset.marketingIndex)
    );
}

function getMarketingCategoryInputs(slot) {
    return Array.from(
        document.querySelectorAll(`[data-marketing-category-slot="${slot}"]`)
    ).sort(
        (a, b) => Number(a.dataset.marketingCategoryIndex) - Number(b.dataset.marketingCategoryIndex)
    );
}

function populateMarketingCategorySelects() {
    ["publicidade1", "publicidade2"].forEach(slot => {
        getMarketingCategoryInputs(slot).forEach(select => {
            const current = select.value || "";
            select.innerHTML = `<option value="">Sem categoria</option>`;
            categories.forEach(category => {
                const option = document.createElement("option");
                option.value = category.id;
                option.textContent = category.nome;
                select.appendChild(option);
            });
            select.value = categories.some(c => String(c.id) === String(current)) ? current : "";
        });
    });
}

function normalizeMarketingEntry(entry) {
    if (typeof entry === "string") {
        return { imageUrl: entry.trim(), categoryId: "" };
    }
    if (entry && typeof entry === "object") {
        return {
            imageUrl: String(entry.imageUrl || entry.url || entry.src || entry.imagem || "").trim(),
            categoryId: String(entry.categoryId || entry.categoriaId || "").trim()
        };
    }
    return { imageUrl: "", categoryId: "" };
}

function setMarketingInputs(slot, values = []) {
    const images = getMarketingInputs(slot);
    const categoriesInputs = getMarketingCategoryInputs(slot);
    const normalized = Array.isArray(values) ? values.map(normalizeMarketingEntry) : [];

    images.forEach((input, index) => {
        input.value = normalized[index]?.imageUrl || "";
    });

    categoriesInputs.forEach((select, index) => {
        select.value = normalized[index]?.categoryId || "";
    });
}

function getMarketingValues(slot) {
    const images = getMarketingInputs(slot);
    const categoryInputs = getMarketingCategoryInputs(slot);
    return images.map((input, index) => ({
        imageUrl: input.value.trim(),
        categoryId: categoryInputs[index]?.value || ""
    })).filter(entry => entry.imageUrl);
}

async function loadMarketing() {
    if (!document.querySelector("[data-marketing-slot]")) return;

    try {
        const marketingRef = doc(db, MARKETING_DOCUMENT_PATH[0], MARKETING_DOCUMENT_PATH[1]);
        const snapshot = await getDoc(marketingRef);

        populateMarketingCategorySelects();

        if (!snapshot.exists()) {
            setMarketingInputs("publicidade1", []);
            setMarketingInputs("publicidade2", []);
            return;
        }

        const data = snapshot.data() || {};
        setMarketingInputs("publicidade1", Array.isArray(data.publicidade1) ? data.publicidade1.slice(0, 10) : []);
        setMarketingInputs("publicidade2", Array.isArray(data.publicidade2) ? data.publicidade2.slice(0, 10) : []);
    } catch (error) {
        console.error("Erro ao carregar Marketink:", error);
        showMarketingMessage("Não foi possível carregar os banners.", "error");
    }
}

async function saveMarketing() {
    if (!document.querySelector("[data-marketing-slot]")) return;

    const publicidade1 = getMarketingValues("publicidade1");
    const publicidade2 = getMarketingValues("publicidade2");
    const allEntries = [...publicidade1, ...publicidade2];

    const invalid = allEntries.find(entry => {
        try {
            const parsed = new URL(entry.imageUrl);
            return !["http:", "https:"].includes(parsed.protocol);
        } catch {
            return true;
        }
    });

    if (invalid) {
        showMarketingMessage(`Link de imagem inválido: ${invalid.imageUrl}`, "error");
        return;
    }

    if (saveMarketingButton) {
        saveMarketingButton.disabled = true;
        saveMarketingButton.textContent = "Salvando...";
    }

    try {
        const marketingRef = doc(db, MARKETING_DOCUMENT_PATH[0], MARKETING_DOCUMENT_PATH[1]);
        await setDoc(marketingRef, {
            publicidade1,
            publicidade2,
            atualizadoEm: serverTimestamp()
        }, { merge: true });

        showMarketingMessage("Banners salvos com sucesso.", "success");
    } catch (error) {
        console.error("Erro ao salvar Marketink:", error);
        showMarketingMessage("Não foi possível salvar os banners.", "error");
    } finally {
        if (saveMarketingButton) {
            saveMarketingButton.disabled = false;
            saveMarketingButton.textContent = "Salvar banners";
        }
    }
}

if (saveMarketingButton) {
    saveMarketingButton.addEventListener("click", saveMarketing);
}

// =========================================================
// ENTREGA / FRETE
// =========================================================

const DELIVERY_DOCUMENT_PATH = ["configuracoes", "entrega"];

const deliveryOriginCep = document.getElementById("deliveryOriginCep");
const deliveryMethod = document.getElementById("deliveryMethod");
const deliveryFixedPrice = document.getElementById("deliveryFixedPrice");
const deliveryFixedBox = document.getElementById("deliveryFixedBox");
const deliveryCepRulesBox = document.getElementById("deliveryCepRulesBox");
const deliveryCorreiosBox = document.getElementById("deliveryCorreiosBox");
const deliveryCepRules = document.getElementById("deliveryCepRules");
const addDeliveryCepRule = document.getElementById("addDeliveryCepRule");
const saveDeliveryButton = document.getElementById("saveDeliveryButton");
const deliveryMessage = document.getElementById("deliveryMessage");
const correiosPac = document.getElementById("correiosPac");
const correiosSedex = document.getElementById("correiosSedex");
const deliveryDefaultWeight = document.getElementById("deliveryDefaultWeight");
const deliveryPackageType = document.getElementById("deliveryPackageType");
const deliveryLength = document.getElementById("deliveryLength");
const deliveryWidth = document.getElementById("deliveryWidth");
const deliveryHeight = document.getElementById("deliveryHeight");
const deliveryCorreiosPacEnabled = document.getElementById("deliveryCorreiosPacEnabled");
const deliveryCorreiosSedexEnabled = document.getElementById("deliveryCorreiosSedexEnabled");

function setDeliveryMessage(message, type = "error") {
    if (!deliveryMessage) return;
    deliveryMessage.textContent = message;
    deliveryMessage.style.color = type === "success" ? "#15803d" : "#dc2626";
}

function onlyCepNumbers(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 8);
}

function formatCep(value) {
    const numbers = onlyCepNumbers(value);
    return numbers.length <= 5 ? numbers : numbers.slice(0, 5) + "-" + numbers.slice(5);
}

function createDeliveryCepRule(rule = {}) {
    if (!deliveryCepRules) return;

    const row = document.createElement("div");
    row.className = "admin-delivery-rule";

    row.innerHTML = `
        <div>
            <label>CEP inicial</label>
            <input type="text" inputmode="numeric" maxlength="9" class="delivery-rule-start" placeholder="00000-000" value="${escapeHtml(formatCep(rule.cepInicial || ""))}">
        </div>
        <div>
            <label>CEP final</label>
            <input type="text" inputmode="numeric" maxlength="9" class="delivery-rule-end" placeholder="00000-000" value="${escapeHtml(formatCep(rule.cepFinal || ""))}">
        </div>
        <div>
            <label>Valor (R$)</label>
            <input type="number" min="0" step="0.01" class="delivery-rule-price" placeholder="0,00" value="${Number.isFinite(Number(rule.valor)) ? Number(rule.valor) : ""}">
        </div>
        <button type="button" class="delivery-rule-remove">Remover</button>
    `;

    row.querySelectorAll(".delivery-rule-start, .delivery-rule-end").forEach(input => {
        input.addEventListener("input", () => {
            input.value = formatCep(input.value);
        });
    });

    row.querySelector(".delivery-rule-remove")?.addEventListener("click", () => row.remove());
    deliveryCepRules.appendChild(row);
}

function getDeliveryCepRules() {
    if (!deliveryCepRules) return [];

    return Array.from(deliveryCepRules.querySelectorAll(".admin-delivery-rule"))
        .map(row => ({
            cepInicial: onlyCepNumbers(row.querySelector(".delivery-rule-start")?.value),
            cepFinal: onlyCepNumbers(row.querySelector(".delivery-rule-end")?.value),
            valor: Number(row.querySelector(".delivery-rule-price")?.value || 0)
        }))
        .filter(rule => rule.cepInicial.length === 8 && rule.cepFinal.length === 8 && rule.valor >= 0);
}

function updateDeliveryMethodUI() {
    const method = deliveryMethod?.value;

    deliveryFixedBox?.classList.toggle("admin-delivery-hidden", method !== "frete_fixo");
    deliveryCepRulesBox?.classList.toggle("admin-delivery-hidden", method !== "faixa_cep");
    deliveryCorreiosBox?.classList.toggle("admin-delivery-hidden", method !== "correios");
}

async function loadDeliverySettings() {
    if (!deliveryMethod) return;

    try {
        const deliveryRef = doc(db, DELIVERY_DOCUMENT_PATH[0], DELIVERY_DOCUMENT_PATH[1]);
        const snapshot = await getDoc(deliveryRef);

        if (!snapshot.exists()) {
            updateDeliveryMethodUI();
            return;
        }

        const data = snapshot.data() || {};

        if (deliveryOriginCep) deliveryOriginCep.value = formatCep(data.cepOrigem || "");
        if (deliveryMethod) deliveryMethod.value = data.metodo || "frete_gratis";
        if (deliveryFixedPrice) deliveryFixedPrice.value = data.valorFixo ?? "";
        if (deliveryDefaultWeight) deliveryDefaultWeight.value = data.pesoPadrao ?? "";
        if (deliveryPackageType) deliveryPackageType.value = data.tipoObjeto || "2";
        if (deliveryLength) deliveryLength.value = data.comprimento ?? "";
        if (deliveryWidth) deliveryWidth.value = data.largura ?? "";
        if (deliveryHeight) deliveryHeight.value = data.altura ?? "";
        if (correiosPac) correiosPac.value = data.codigoPac || "03298";
        if (correiosSedex) correiosSedex.value = data.codigoSedex || "03220";
        if (deliveryCorreiosPacEnabled) deliveryCorreiosPacEnabled.checked = data.pacAtivo !== false;
        if (deliveryCorreiosSedexEnabled) deliveryCorreiosSedexEnabled.checked = data.sedexAtivo !== false;

        if (deliveryCepRules) {
            deliveryCepRules.innerHTML = "";
            (Array.isArray(data.faixasCep) ? data.faixasCep : []).forEach(createDeliveryCepRule);
        }

        updateDeliveryMethodUI();
    } catch (error) {
        console.error("Erro ao carregar configurações de entrega:", error);
        setDeliveryMessage("Não foi possível carregar as configurações de entrega.");
    }
}

async function saveDeliverySettings() {
    if (!deliveryMethod) return;

    const cepOrigem = onlyCepNumbers(deliveryOriginCep?.value);

    if (cepOrigem.length !== 8) {
        setDeliveryMessage("Informe um CEP de origem válido com 8 números.");
        deliveryOriginCep?.focus();
        return;
    }

    const metodo = deliveryMethod.value;
    const valorFixo = Number(deliveryFixedPrice?.value || 0);
    const faixasCep = getDeliveryCepRules();

    if (metodo === "frete_fixo" && valorFixo < 0) {
        setDeliveryMessage("Informe um valor de frete válido.");
        return;
    }

    if (metodo === "faixa_cep" && faixasCep.length === 0) {
        setDeliveryMessage("Cadastre pelo menos uma faixa de CEP.");
        return;
    }

    if (metodo === "correios" && !deliveryCorreiosPacEnabled?.checked && !deliveryCorreiosSedexEnabled?.checked) {
        setDeliveryMessage("Ative pelo menos PAC ou SEDEX.");
        return;
    }

    const payload = {
        cepOrigem,
        metodo,
        valorFixo,
        faixasCep,
        pesoPadrao: Number(deliveryDefaultWeight?.value || 0),
        tipoObjeto: deliveryPackageType?.value || "2",
        comprimento: Number(deliveryLength?.value || 0),
        largura: Number(deliveryWidth?.value || 0),
        altura: Number(deliveryHeight?.value || 0),
        codigoPac: correiosPac?.value.trim() || "03298",
        codigoSedex: correiosSedex?.value.trim() || "03220",
        pacAtivo: deliveryCorreiosPacEnabled?.checked === true,
        sedexAtivo: deliveryCorreiosSedexEnabled?.checked === true,
        atualizadoEm: serverTimestamp()
    };

    if (saveDeliveryButton) {
        saveDeliveryButton.disabled = true;
        saveDeliveryButton.textContent = "Salvando...";
    }

    try {
        const deliveryRef = doc(db, DELIVERY_DOCUMENT_PATH[0], DELIVERY_DOCUMENT_PATH[1]);

        await setDoc(deliveryRef, payload, { merge: true });

        setDeliveryMessage("Configurações de entrega salvas com sucesso.", "success");
    } catch (error) {
        console.error("Erro ao salvar configurações de entrega:", error);
        setDeliveryMessage("Não foi possível salvar as configurações de entrega.");
    } finally {
        if (saveDeliveryButton) {
            saveDeliveryButton.disabled = false;
            saveDeliveryButton.textContent = "Salvar configurações de entrega";
        }
    }
}

deliveryOriginCep?.addEventListener("input", () => {
    deliveryOriginCep.value = formatCep(deliveryOriginCep.value);
});

deliveryMethod?.addEventListener("change", updateDeliveryMethodUI);
addDeliveryCepRule?.addEventListener("click", () => createDeliveryCepRule());
saveDeliveryButton?.addEventListener("click", saveDeliverySettings);


// =========================================================
// RODAPÉ DO SITE
// =========================================================
const FOOTER_DOCUMENT_PATH = ["configuracoes", "rodape"];
const footerFieldIds = [
    "footerLogo","footerSiteName","footerDescription","footerCopyright","footerCol1Title","footerCol2Title","footerCol3Title",
    "footerCnpj","footerRazaoSocial","footerAddress","footerCityState","footerLegalText","footerBottomText","footerDeveloperText"
];
const footerSocials = ["Instagram","Tiktok","Youtube","Pinterest","Facebook","Whatsapp","Telegram"];

function footerEl(id){ return document.getElementById(id); }
function setFooterValue(id,value){ const el=footerEl(id); if(el) el.value = value ?? ""; }
function getFooterValue(id){ return String(footerEl(id)?.value || "").trim(); }
function setFooterChecked(id,value){ const el=footerEl(id); if(el) el.checked = value !== false; }
function getFooterChecked(id){ return footerEl(id)?.checked === true; }

function footerContactType(label){
    const text = String(label || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    if (text === "whatsapp" || text === "whats app") return "whatsapp";
    if (text === "telefone" || text === "tel" || text === "phone") return "telefone";
    if (text === "e-mail" || text === "email" || text === "mail") return "email";

    if (
        text === "horário" ||
        text === "horario" ||
        text === "horário de atendimento" ||
        text === "horario de atendimento" ||
        text === "horário de funcionamento" ||
        text === "horario de funcionamento"
    ) {
        return "horario";
    }

    return "";
}

function footerDisplayContactValue(value, type){
    const raw = String(value ?? "").trim();
    if (!raw) return "";

    if (type === "whatsapp") {
        const match = raw.match(/(?:phone=|wa\.me\/|whatsapp\.com\/send\?phone=)(\+?\d+)/i);
        if (match) return match[1].replace(/^\+/, "");
        if (/^https?:\/\//i.test(raw)) return "";
        return raw.replace(/\D/g, "");
    }

    if (type === "telefone") return raw.replace(/^tel:/i, "").replace(/\D/g, "").trim();
    if (type === "email") return raw.replace(/^mailto:/i, "").trim();

    return raw;
}

function footerStoredContactValue(value, type){
    const raw = String(value ?? "").trim();
    if (!raw) return "";

    if (type === "whatsapp") {
        const number = raw
            .replace(/^https?:\/\/[^/]*\/send\?phone=/i, "")
            .replace(/^https?:\/\/wa\.me\//i, "")
            .replace(/\D/g, "");

        return number ? `https://wa.me/${number}` : "";
    }

    if (type === "telefone") {
        const number = raw.replace(/^tel:/i, "").replace(/\D/g, "");
        return number ? `tel:${number}` : "";
    }

    if (type === "email") {
        const email = raw.replace(/^mailto:/i, "").trim();
        return email ? `mailto:${email}` : "";
    }

    return raw;
}

function footerColumn(index){
    const links=[];

    for(let i=1;i<=4;i++){
        const label = getFooterValue(`footerCol${index}Label${i}`);
        const rawValue = getFooterValue(`footerCol${index}Url${i}`);
        const type = footerContactType(label);

        const url = type
            ? footerStoredContactValue(rawValue, type)
            : rawValue;

        if(label || rawValue) links.push({label,url});
    }

    return {
        title:getFooterValue(`footerCol${index}Title`),
        links
    };
}

function footerValidUrl(value){
    const raw = String(value || "").trim();
    if(!raw) return true;

    try {
        const u = new URL(raw);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

function footerNormalizeWhatsapp(value){
    const raw = String(value || "").trim();
    if(!raw) return "";

    const match = raw.match(/(?:phone=|wa\.me\/|whatsapp\.com\/send\?phone=)(\+?\d+)/i);
    if(match){
        const number = match[1].replace(/\D/g, "");
        return number ? `https://wa.me/${number}` : "";
    }

    const number = raw.replace(/\D/g, "");
    return number ? `https://wa.me/${number}` : "";
}

function footerValidEmail(value){
    const email = String(value || "")
        .replace(/^mailto:/i, "")
        .trim();

    if(!email) return true;

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function footerValidPhone(value){
    const phone = String(value || "")
        .replace(/^tel:/i, "")
        .replace(/\D/g, "");

    if(!phone) return true;

    return phone.length >= 8;
}

async function loadFooterSettings(){
    const saveButton=footerEl("saveFooterButton");
    if(!saveButton) return;

    try{
        const ref=doc(db,FOOTER_DOCUMENT_PATH[0],FOOTER_DOCUMENT_PATH[1]);
        const snap=await getDoc(ref);

        if(!snap.exists()) return;

        const data=snap.data()||{};
        const id=data.identidade||{};
        const legal=data.informacoesLegais||{};
        const bottom=data.rodapeInferior||{};

        setFooterValue("footerLogo",id.logo);
        setFooterValue("footerSiteName",id.nome);
        setFooterValue("footerDescription",id.descricao);
        setFooterValue("footerCopyright",id.copyright);

        setFooterValue("footerCnpj",legal.cnpj);
        setFooterValue("footerRazaoSocial",legal.razaoSocial);
        setFooterValue("footerAddress",legal.endereco);
        setFooterValue("footerCityState",legal.cidadeEstado);
        setFooterValue("footerLegalText",legal.texto);

        setFooterValue("footerBottomText",bottom.texto);
        setFooterValue("footerDeveloperText",bottom.desenvolvidoPor);

        (data.colunas||[]).slice(0,3).forEach((col,idx)=>{
            const n=idx+1;

            setFooterValue(`footerCol${n}Title`,col.title);

            (col.links||[]).slice(0,4).forEach((l,i)=>{
                const label = l?.label || "";
                const type = footerContactType(label);

                setFooterValue(`footerCol${n}Label${i+1}`,label);
                setFooterValue(
                    `footerCol${n}Url${i+1}`,
                    type
                        ? footerDisplayContactValue(l?.url,type)
                        : (l?.url || "")
                );
            });
        });

        const social=data.redesSociais||{};

        footerSocials.forEach(name=>{
            const key=name.charAt(0).toLowerCase()+name.slice(1);
            const v=social[key]||{};

            setFooterValue(`footer${name}`,v.url);
            setFooterChecked(`footer${name}Enabled`,v.ativo);
        });

    }catch(error){
        console.error("Erro ao carregar rodapé:",error);
        setFooterMessage(
            "Não foi possível carregar as configurações do rodapé."
        );
    }
}

function setFooterMessage(message,type="error"){
    const el=footerEl("footerMessage");
    if(!el)return;

    el.textContent=message;
    el.style.color=type==="success"?"#15803d":"#dc2626";
}

async function saveFooterSettings(){
    const button=footerEl("saveFooterButton");
    if(!button)return;

    const urlFields = [{
        value: getFooterValue("footerLogo"),
        label: "Logo do rodapé"
    }];

    for(let n=1;n<=3;n++){
        for(let i=1;i<=4;i++){
            const label=getFooterValue(`footerCol${n}Label${i}`);
            const value=getFooterValue(`footerCol${n}Url${i}`);
            const type=footerContactType(label);

            if(type === "email"){
                if(!footerValidEmail(value)){
                    setFooterMessage("Informe um e-mail válido.");
                    footerEl(`footerCol${n}Url${i}`)?.focus();
                    return;
                }
                continue;
            }

            if(type === "telefone" || type === "whatsapp"){
                if(!footerValidPhone(value)){
                    setFooterMessage(`Informe um número válido para ${label || type}.`);
                    footerEl(`footerCol${n}Url${i}`)?.focus();
                    return;
                }
                continue;
            }

            // Horário de atendimento é texto, não é URL.
            if(type === "horario"){
                continue;
            }

            if(value){
                urlFields.push({
                    value,
                    label: label || `Coluna ${n}, item ${i}`
                });
            }
        }
    }

    footerSocials.forEach(name=>{
        const value = getFooterValue(`footer${name}`);
        const enabled = getFooterChecked(`footer${name}Enabled`);

        if(name === "Whatsapp" && value){
            const normalized = footerNormalizeWhatsapp(value);
            if(!normalized){
                setFooterMessage("Informe um número de WhatsApp válido.");
                footerEl(`footer${name}`)?.focus();
                return;
            }
            setFooterValue(`footer${name}`, normalized);
            return;
        }

        if(enabled && value){
            urlFields.push({
                value,
                label: name
            });
        }
    });

    const invalidField=urlFields.find(item=>!footerValidUrl(item.value));

    if(invalidField){
        setFooterMessage(
            `${invalidField.label}: informe uma URL válida começando com http:// ou https://.`
        );
        return;
    }

    button.disabled=true;
    button.textContent="Salvando...";

    const payload={
        identidade:{
            logo:getFooterValue("footerLogo"),
            nome:getFooterValue("footerSiteName"),
            descricao:getFooterValue("footerDescription"),
            copyright:getFooterValue("footerCopyright")
        },
        colunas:[
            footerColumn(1),
            footerColumn(2),
            footerColumn(3)
        ],
        redesSociais:{},
        informacoesLegais:{
            cnpj:getFooterValue("footerCnpj"),
            razaoSocial:getFooterValue("footerRazaoSocial"),
            endereco:getFooterValue("footerAddress"),
            cidadeEstado:getFooterValue("footerCityState"),
            texto:getFooterValue("footerLegalText")
        },
        rodapeInferior:{
            texto:getFooterValue("footerBottomText"),
            desenvolvidoPor:getFooterValue("footerDeveloperText")
        },
        atualizadoEm:serverTimestamp()
    };

    footerSocials.forEach(name=>{
        const key=name.charAt(0).toLowerCase()+name.slice(1);

        payload.redesSociais[key]={
            url:getFooterValue(`footer${name}`),
            ativo:getFooterChecked(`footer${name}Enabled`)
        };
    });

    try{
        await setDoc(
            doc(db,FOOTER_DOCUMENT_PATH[0],FOOTER_DOCUMENT_PATH[1]),
            payload,
            {merge:true}
        );

        setFooterMessage(
            "Configurações do rodapé salvas com sucesso.",
            "success"
        );

    }catch(error){
        console.error("Erro ao salvar rodapé:",error);
        setFooterMessage(
            "Não foi possível salvar as configurações do rodapé."
        );

    }finally{
        button.disabled=false;
        button.textContent="Salvar configurações do rodapé";
    }
}

footerEl("saveFooterButton")?.addEventListener("click",saveFooterSettings);

// =========================================================
// DATA
// =========================================================

function getTimestampMillis(timestamp) {

    if (!timestamp) {
        return 0;
    }

    try {

        if (
            typeof timestamp.toMillis ===
            "function"
        ) {
            return timestamp.toMillis();
        }

        if (
            typeof timestamp.toDate ===
            "function"
        ) {
            return timestamp
                .toDate()
                .getTime();
        }

        const date =
            new Date(timestamp);

        const time =
            date.getTime();

        return Number.isNaN(time)
            ? 0
            : time;

    } catch (error) {

        return 0;

    }
}


function formatDate(timestamp) {

    if (!timestamp) {
        return "Não informado";
    }

    try {

        let date;

        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            date =
                timestamp.toDate();

        } else {

            date =
                new Date(timestamp);

        }

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Não informado";

        }

        return date.toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    } catch (error) {

        return "Não informado";

    }
}


function formatDateTime(timestamp) {

    if (!timestamp) {
        return "Não informado";
    }

    try {

        let date;

        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            date =
                timestamp.toDate();

        } else {

            date =
                new Date(timestamp);

        }

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "Não informado";

        }

        return date.toLocaleString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch (error) {

        return "Não informado";

    }
}


function formatPrice(value) {

    const number =
        Number(value);

    if (
        Number.isNaN(number)
    ) {

        return "R$ 0,00";

    }

    return number.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


// =========================================================
// NAVEGAÇÃO
// =========================================================

function openAdminSection(
    sectionId
) {

    const sections =
        document.querySelectorAll(
            ".admin-page-section"
        );

    sections.forEach(
        section => {

            section.classList.remove(
                "active-section"
            );

        }
    );


    const selectedSection =
        document.getElementById(
            sectionId
        );

    if (!selectedSection) {
        return;
    }


    selectedSection.classList.add(
        "active-section"
    );


    document
        .querySelectorAll(
            ".admin-nav-link"
        )
        .forEach(
            link => {

                link.classList.toggle(
                    "active",
                    link.dataset.section ===
                    sectionId
                );

            }
        );


    const sidebar =
        document.querySelector(
            ".admin-sidebar"
        );

    const overlay =
        document.querySelector(
            ".admin-menu-overlay"
        );

    const menuButton =
        document.querySelector(
            ".admin-menu-button"
        );


    if (sidebar) {
        sidebar.classList.remove(
            "open"
        );
    }

    if (overlay) {
        overlay.classList.remove(
            "open"
        );
    }

    if (menuButton) {

        menuButton.classList.remove(
            "active"
        );

        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (
        sectionId === "pedidos"
    ) {

        loadOrders();

    }

if (
    sectionId === "dashboard"
) {
    loadOrders();
}
    if (
        sectionId === "produtos"
    ) {

        loadCategories().then(
            () => loadProducts()
        );

    }


    if (
        sectionId === "clientes"
    ) {

        loadClients();

    }

    if (
        sectionId === "marketing"
    ) {

        loadMarketing();

    }

    if (sectionId === "configuracoes") {
        loadDeliverySettings();
    }
    if (sectionId === "rodape") {
        loadFooterSettings();
    }

}


function goToDashboard() {

    openAdminSection(
        "dashboard"
    );

}


// =========================================================
// PRODUTO - LIMPAR FORMULÁRIO
// =========================================================

function resetProductImagePreview() {

    const preview =
        document.getElementById(
            "productImagePreview"
        );

    if (!preview) {
        return;
    }

    preview.innerHTML = `
        <div class="admin-preview-empty">
            As imagens aparecerão aqui.
        </div>
    `;

}


function clearProductForm() {

    editingProductId =
        null;


    if (productForm) {
        productForm.reset();
    }


    if (productTitle) {
        productTitle.value = "";
    }

    if (productDescription) {
        productDescription.value = "";
    }

    if (productPrice) {
        productPrice.value = "";
    }

    if (productStock) {
        productStock.value = "";
    }

    if (productCategory) {
        productCategory.value = "";
    }

    if (productImage1) {
        productImage1.value = "";
    }

    if (productImage2) {
        productImage2.value = "";
    }

    if (productImage3) {
        productImage3.value = "";
    }

    if (productActive) {
        productActive.checked = true;
    }

if (productSponsored) {
    productSponsored.checked = false;
}

if (productMostViewed) {
    productMostViewed.checked = false;
}

if (productYouMayLike) {
    productYouMayLike.checked = false;
}

if (productBestSelling) {
    productBestSelling.checked = false;
}

if (productOffer) {
    productOffer.checked = false;
}

if (productOfferPercent) {
    productOfferPercent.value = "10";
    productOfferPercent.disabled = true;
}
    const submitButton =
        productForm?.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.textContent =
            "Cadastrar produto";

    }


    const cancelButton =
        document.getElementById(
            "cancelProductEdit"
        );


    if (cancelButton) {
        cancelButton.remove();
    }


    resetProductImagePreview();

}


// =========================================================
// PRÉVIA DAS IMAGENS
// =========================================================

function updateFormImagePreview() {

    const preview =
        document.getElementById(
            "productImagePreview"
        );

    if (!preview) {
        return;
    }


    const inputs = [
        productImage1,
        productImage2,
        productImage3
    ];


    const images =
        inputs
            .map(
                input =>
                    input
                        ? input.value.trim()
                        : ""
            )
            .filter(Boolean);


    preview.innerHTML = "";


    if (
        images.length === 0
    ) {

        resetProductImagePreview();

        return;

    }


    images.forEach(
        image => {

            const img =
                document.createElement(
                    "img"
                );


            img.src =
                image;

            img.alt =
                productTitle?.value ||
                "Produto";


            img.style.width =
                "100%";

            img.style.height =
                "180px";

            img.style.objectFit =
                "contain";

            img.style.borderRadius =
                "10px";

            img.style.border =
                "1px solid #dee2e6";

            img.style.background =
                "#f8f9fa";


            img.onerror =
                () => {

                    img.style.display =
                        "none";

                };


            preview.appendChild(
                img
            );

        }
    );

}


[
    productImage1,
    productImage2,
    productImage3
].forEach(
    input => {

        if (!input) {
            return;
        }

        input.addEventListener(
            "input",
            updateFormImagePreview
        );

    }
);


// =========================================================
// CLIENTES
// =========================================================

function getClientAddress(client) {

    const parts = [];


    if (client.endereco) {

        let rua =
            String(
                client.endereco
            );

        if (client.numero) {

            rua +=
                ", " +
                String(
                    client.numero
                );

        }

        parts.push(
            rua
        );

    }


    if (
        client.complemento
    ) {

        parts.push(
            client.complemento
        );

    }


    if (
        client.bairro
    ) {

        parts.push(
            client.bairro
        );

    }


    if (
        client.cidade
    ) {

        let cidadeEstado =
            String(
                client.cidade
            );

        if (client.estado) {

            cidadeEstado +=
                " - " +
                String(
                    client.estado
                );

        }

        parts.push(
            cidadeEstado
        );

    }


    if (client.cep) {

        parts.push(
            "CEP: " +
            String(
                client.cep
            )
        );

    }


    return parts.length
        ? parts.join(" | ")
        : "Não informado";

}


function getClientWhatsapp(client) {

    return (
        client.whatsapp ||
        "Não informado"
    );

}


function getClientCpf(client) {

    return (
        client.cpf ||
        "Não informado"
    );

}


function renderClients(
    list
) {

    if (!clientsTableBody) {
        return;
    }


    clientsTableBody.innerHTML =
        "";


    if (
        list.length === 0
    ) {

        clientsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="table-empty"
                >
                    Nenhum cliente encontrado.
                </td>
            </tr>
        `;

        return;

    }


    list.forEach(
        client => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHtml(
                        client.nome ||
                        "Não informado"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        client.email ||
                        "Não informado"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        client.telefone ||
                        "Não informado"
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        getClientAddress(
                            client
                        )
                    )}
                </td>

                <td>
                    ${formatDate(
                        client.dataCadastro
                    )}
                </td>

                <td>

                    <div
                        style="
                            display:flex;
                            gap:8px;
                            flex-wrap:wrap;
                        "
                    >

                        <button
                            type="button"
                            class="client-details-button"
                            data-id="${escapeHtml(
                                client.id
                            )}"
                            style="
                                border:1px solid #16803c;
                                background:#fff;
                                color:#16803c;
                                border-radius:7px;
                                padding:7px 12px;
                                cursor:pointer;
                                font-weight:700;
                            "
                        >
                            Ver cadastro
                        </button>


                        <button
                            type="button"
                            class="client-delete-button"
                            data-id="${escapeHtml(
                                client.id
                            )}"
                            style="
                                border:1px solid #dc2626;
                                background:#dc2626;
                                color:#fff;
                                border-radius:7px;
                                padding:7px 12px;
                                cursor:pointer;
                                font-weight:700;
                            "
                        >
                            Excluir
                        </button>

                    </div>

                </td>

            `;


            clientsTableBody.appendChild(
                row
            );

        }
    );


    // =====================================================
    // DETALHES
    // =====================================================

    clientsTableBody
        .querySelectorAll(
            ".client-details-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const client =
                            clients.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );


                        if (!client) {
                            return;
                        }


                        showClientDetails(
                            client
                        );

                    }
                );

            }
        );


    // =====================================================
    // EXCLUIR DOCUMENTO FIRESTORE
    // =====================================================

    clientsTableBody
        .querySelectorAll(
            ".client-delete-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const client =
                            clients.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );


                        if (!client) {
                            return;
                        }


                        const name =
                            client.nome ||
                            client.email ||
                            "este cliente";


                        const confirmed =
                            window.confirm(
                                `Deseja realmente excluir o cadastro de "${name}"?\n\nIsso excluirá o documento do cliente no Firestore. A conta do Firebase Authentication não pode ser excluída por este painel sem um backend/Admin SDK.`
                            );


                        if (!confirmed) {
                            return;
                        }


                        await deleteClient(
                            client.id
                        );

                    }
                );

            }
        );

}


async function loadClients() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "clientes"
                )
            );


        clients = [];


        snapshot.forEach(
            documentSnapshot => {

                clients.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        clients.sort(
            (a, b) => {

                return (
                    getTimestampMillis(
                        b.dataCadastro
                    ) -
                    getTimestampMillis(
                        a.dataCadastro
                    )
                );

            }
        );


        if (totalClients) {

            totalClients.textContent =
                clients.length;

        }


        renderClients(
            clients
        );


    } catch (error) {

        console.error(
            "Erro ao carregar clientes:",
            error
        );


        if (totalClients) {

            totalClients.textContent =
                "—";

        }


        showMessage(
            "Não foi possível carregar os clientes."
        );

    }

}


// =========================================================
// EXCLUIR CLIENTE DO FIRESTORE
// =========================================================

async function deleteClient(
    clientId
) {

    try {

        await deleteDoc(
            doc(
                db,
                "clientes",
                clientId
            )
        );


        showMessage(
            "Cadastro do cliente excluído do Firestore.",
            "success"
        );


        await loadClients();


    } catch (error) {

        console.error(
            "Erro ao excluir cliente:",
            error
        );


        showMessage(
            "Não foi possível excluir o cadastro do cliente."
        );

    }

}


// =========================================================
// DETALHES COMPLETOS DO CLIENTE
// =========================================================

function showClientDetails(
    client
) {

    const oldModal =
        document.getElementById(
            "clientDetailsModal"
        );


    if (oldModal) {
        oldModal.remove();
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "clientDetailsModal";


    modal.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.65);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        z-index:10000;
    `;


    const address =
        getClientAddress(
            client
        );


    modal.innerHTML = `

        <div
            style="
                width:min(900px,100%);
                max-height:90vh;
                overflow:auto;
                background:#fff;
                border-radius:18px;
                padding:28px;
                position:relative;
                box-shadow:0 20px 60px rgba(0,0,0,.25);
            "
        >

            <button
                type="button"
                id="closeClientDetails"
                style="
                    position:absolute;
                    top:12px;
                    right:12px;
                    width:40px;
                    height:40px;
                    border:none;
                    border-radius:50%;
                    background:#16803c;
                    color:#fff;
                    font-size:22px;
                    cursor:pointer;
                "
            >
                ×
            </button>


            <div
                style="
                    border-bottom:1px solid #e5e7eb;
                    padding-bottom:18px;
                    margin-bottom:22px;
                "
            >

                <span
                    style="
                        color:#16803c;
                        font-size:12px;
                        font-weight:800;
                        letter-spacing:.08em;
                    "
                >
                    CADASTRO DO CLIENTE
                </span>

                <h2
                    style="
                        margin:6px 50px 4px 0;
                        color:#17351f;
                    "
                >
                    ${escapeHtml(
                        client.nome ||
                        "Cliente"
                    )}
                </h2>

                <p
                    style="
                        margin:0;
                        color:#66756b;
                    "
                >
                    ${escapeHtml(
                        client.email ||
                        "E-mail não informado"
                    )}
                </p>

            </div>


            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(220px,1fr)
                        );
                    gap:14px;
                "
            >

                ${clientInfoCard(
                    "CPF",
                    getClientCpf(client)
                )}

                ${clientInfoCard(
                    "Data de nascimento",
                    client.dataNascimento ||
                    "Não informado"
                )}

                ${clientInfoCard(
                    "E-mail",
                    client.email ||
                    "Não informado"
                )}

                ${clientInfoCard(
                    "Telefone",
                    client.telefone ||
                    "Não informado"
                )}

                ${clientInfoCard(
                    "WhatsApp",
                    getClientWhatsapp(client)
                )}

                ${clientInfoCard(
                    "CEP",
                    client.cep ||
                    "Não informado"
                )}

                ${clientInfoCard(
                    "Estado",
                    client.estado ||
                    "Não informado"
                )}

                ${clientInfoCard(
                    "Cidade",
                    client.cidade ||
                    "Não informado"
                )}

                ${clientInfoCard(
                    "Bairro",
                    client.bairro ||
                    "Não informado"
                )}

                ${clientInfoCard(
                    "Rua / Avenida",
                    client.endereco ||
                    "Não informado"
                )}

                ${clientInfoCard(
                    "Número",
                    client.numero ||
                    "Não informado"
                )}

                ${clientInfoCard(
                    "Complemento",
                    client.complemento ||
                    "Não informado"
                )}

                ${clientInfoCard(
                    "Ponto de referência",
                    client.referencia ||
                    "Não informado"
                )}

                ${clientInfoCard(
                    "Status",
                    client.status ||
                    "Não informado"
                )}

                ${clientInfoCard(
                    "Tipo de usuário",
                    client.tipoUsuario ||
                    "cliente"
                )}

                ${clientInfoCard(
                    "Cadastro realizado",
                    formatDateTime(
                        client.dataCadastro
                    )
                )}

            </div>


            <div
                style="
                    margin-top:22px;
                    padding:18px;
                    border-radius:12px;
                    background:#eaf7ef;
                    color:#17351f;
                "
            >

                <strong>
                    Endereço completo para entrega
                </strong>

                <p
                    style="
                        margin:7px 0 0;
                        line-height:1.6;
                    "
                >
                    ${escapeHtml(
                        address
                    )}
                </p>

            </div>


            <div
                style="
                    margin-top:18px;
                    padding:16px;
                    border-top:1px solid #e5e7eb;
                    color:#66756b;
                    font-size:13px;
                "
            >

                <strong>
                    Preferências
                </strong>

                <p>
                    Termos:
                    ${
                        client.aceitaTermos === true
                            ? "Aceito"
                            : "Não registrado"
                    }
                    <br>

                    Privacidade:
                    ${
                        client.aceitaPrivacidade === true
                            ? "Aceito"
                            : "Não registrado"
                    }
                    <br>

                    Marketing:
                    ${
                        client.aceitaMarketing === true
                            ? "Aceito"
                            : "Não"
                    }
                </p>

            </div>


            <div
                style="
                    margin-top:20px;
                    display:flex;
                    justify-content:flex-end;
                "
            >

                <button
                    type="button"
                    id="modalDeleteClient"
                    style="
                        border:1px solid #dc2626;
                        background:#dc2626;
                        color:#fff;
                        border-radius:8px;
                        padding:10px 16px;
                        cursor:pointer;
                        font-weight:800;
                    "
                >
                    Excluir cadastro
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const closeButton =
        document.getElementById(
            "closeClientDetails"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => modal.remove()
        );

    }


    const deleteButton =
        document.getElementById(
            "modalDeleteClient"
        );


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            async () => {

                const confirmed =
                    window.confirm(
                        `Deseja realmente excluir o cadastro de "${client.nome || client.email || "este cliente"}"?`
                    );


                if (!confirmed) {
                    return;
                }


                await deleteClient(
                    client.id
                );


                modal.remove();

            }
        );

    }


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                modal.remove();

            }

        }
    );

}


function clientInfoCard(
    label,
    value
) {

    return `

        <div
            style="
                padding:14px;
                border:1px solid #d9e5dc;
                border-radius:11px;
                background:#fbfdfb;
            "
        >

            <span
                style="
                    display:block;
                    color:#66756b;
                    font-size:12px;
                    margin-bottom:5px;
                    font-weight:700;
                "
            >
                ${escapeHtml(label)}
            </span>

            <strong
                style="
                    display:block;
                    color:#17351f;
                    line-height:1.45;
                    word-break:break-word;
                "
            >
                ${escapeHtml(value)}
            </strong>

        </div>

    `;

}


// =========================================================
// PESQUISA CLIENTES
// =========================================================

if (clientSearch) {

    clientSearch.addEventListener(
        "input",
        () => {

            const search =
                clientSearch.value
                    .trim()
                    .toLowerCase();


            if (!search) {

                renderClients(
                    clients
                );

                return;

            }


            const filtered =
                clients.filter(
                    client => {

                        const values = [

                            client.nome,
                            client.email,
                            client.telefone,
                            client.whatsapp,
                            client.cpf,
                            client.cep,
                            client.endereco,
                            client.numero,
                            client.bairro,
                            client.cidade,
                            client.estado

                        ];


                        return values.some(
                            value =>
                                String(
                                    value ||
                                    ""
                                )
                                .toLowerCase()
                                .includes(
                                    search
                                )
                        );

                    }
                );


            renderClients(
                filtered
            );

        }
    );

}


// =========================================================
// CATEGORIAS DE PRODUTOS
// =========================================================

function normalizeCategoryName(value) {

    return String(value || "")
        .trim()
        .replace(/\s+/g, " ");
}


function getProductCategoryId(product) {

    if (!product) {
        return "";
    }

    const directId =
        product.categoriaId ||
        product.categoryId ||
        (product.categoria &&
            typeof product.categoria === "object"
            ? product.categoria.id
            : "");

    if (directId) {
        return String(directId);
    }

    const legacyName =
        typeof product.categoria === "string"
            ? normalizeCategoryName(product.categoria)
            : "";

    if (legacyName) {

        const match =
            categories.find(
                category =>
                    normalizeCategoryName(category.nome)
                        .toLowerCase() ===
                    legacyName.toLowerCase()
            );

        return match
            ? match.id
            : "";
    }

    return "";
}


function getProductCategoryName(product) {

    const categoryId =
        getProductCategoryId(product);

    if (!categoryId) {
        return "Sem categoria";
    }

    const category =
        categories.find(
            item => item.id === categoryId
        );

    return category
        ? category.nome
        : "Sem categoria";
}


function getCategoryProductCount(categoryId) {

    return products.filter(
        product =>
            getProductCategoryId(product) ===
            categoryId
    ).length;
}


function getUncategorizedProductCount() {

    return products.filter(
        product => !getProductCategoryId(product)
    ).length;
}


function setNewCategoryMessage(message, type = "error") {

    if (!newCategoryMessage) {
        return;
    }

    newCategoryMessage.textContent = message;
    newCategoryMessage.style.color =
        type === "success"
            ? "#15803d"
            : "#dc2626";
}


function openNewCategoryModal() {

    if (!newCategoryModal) {
        return;
    }

    setNewCategoryMessage("");

    if (newCategoryName) {
        newCategoryName.value = "";
    }

    newCategoryModal.classList.add("open");
    newCategoryModal.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
        newCategoryName?.focus();
    }, 50);
}


function closeNewCategoryModal() {

    if (!newCategoryModal) {
        return;
    }

    newCategoryModal.classList.remove("open");
    newCategoryModal.setAttribute("aria-hidden", "true");
    setNewCategoryMessage("");
}


function populateProductCategorySelect(selectedId = "") {

    if (!productCategory) {
        return;
    }

    const previousValue =
        selectedId ||
        productCategory.value ||
        "";

    productCategory.innerHTML = `
        <option value="">
            Sem categoria
        </option>
    `;

    categories.forEach(
        category => {

            const option =
                document.createElement("option");

            option.value = category.id;
            option.textContent = category.nome;

            productCategory.appendChild(option);
        }
    );

    const valid =
        previousValue &&
        categories.some(
            category => category.id === previousValue
        );

    productCategory.value =
        valid
            ? previousValue
            : "";
}


function renderCategories() {

    if (!adminCategoriesList) {
        return;
    }

    const cards = [];

    cards.push(`
        <button
            type="button"
            class="admin-category-card"
            data-category-id=""
        >
            <span class="admin-category-card-title">
                Sem categoria
            </span>
            <span class="admin-category-card-count">
                ${getUncategorizedProductCount()}
                ${getUncategorizedProductCount() === 1 ? "produto" : "produtos"}
            </span>
        </button>
    `);

   categories.forEach(
    category => {

        const count =
            getCategoryProductCount(category.id);

        cards.push(`
            <button
                type="button"
                class="admin-category-card"
                data-category-id="${escapeHtml(category.id)}"
            >
                <span class="admin-category-card-title">
                    ${escapeHtml(category.nome)}
                </span>

                <span class="admin-category-card-count">
                    ${count}
                    ${count === 1 ? "produto" : "produtos"}
                </span>

                <span
                    class="admin-category-delete"
                    data-category-delete="${escapeHtml(category.id)}"
                    style="
                        display:inline-block;
                        margin-top:10px;
                        padding:6px 10px;
                        border-radius:6px;
                        background:#dc2626;
                        color:#fff;
                        font-size:12px;
                        font-weight:700;
                        cursor:pointer;
                    "
                >
                    Excluir categoria
                </span>
            </button>
        `);
    }
);

    adminCategoriesList.innerHTML = cards.join("");

    adminCategoriesList
        .querySelectorAll(".admin-category-card")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        showCategoryProducts(
                            button.dataset.categoryId || ""
                        );
                    }
                );
            }
        );

adminCategoriesList
    .querySelectorAll(".admin-category-delete")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                async event => {

                    event.stopPropagation();

                    const categoryId =
                        button.dataset.categoryDelete;

                    const category =
                        categories.find(
                            item =>
                                item.id === categoryId
                        );

                    if (!category) {
                        return;
                    }

                    const confirmed =
                        window.confirm(
                            `Deseja realmente excluir a categoria "${category.nome}"?\n\nEssa ação será permanente e não poderá ser desfeita.`
                        );

                    if (!confirmed) {
                        return;
                    }

                    try {

                        await deleteDoc(
                            doc(
                                db,
                                "categorias",
                                categoryId
                            )
                        );

                        categories =
                            categories.filter(
                                item =>
                                    item.id !== categoryId
                            );

                        populateProductCategorySelect();

                        renderCategories();

                    } catch (error) {

                        console.error(
                            "Erro ao excluir categoria:",
                            error
                        );

                        window.alert(
                            "Não foi possível excluir a categoria."
                        );
                    }
                }
            );
        }
    );
}


function renderCategoryProducts(categoryId) {

    if (!adminCategoryProductsBody) {
        return;
    }

    const filtered =
        products.filter(
            product =>
                getProductCategoryId(product) ===
                categoryId
        );

    if (filtered.length === 0) {

        adminCategoryProductsBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="admin-category-products-empty"
                >
                    Nenhum produto nesta categoria.
                </td>
            </tr>
        `;

        return;
    }

    adminCategoryProductsBody.innerHTML =
        filtered
            .map(
                product => {

                    const estoque = Number(product.estoque) || 0;
const active = product.ativo === true;

const esgotado = estoque <= 0;

const status = esgotado
    ? "ESGOTADO"
    : active
        ? "Ativo"
        : "Inativo";

const statusClass = esgotado
    ? "status-out"
    : active
        ? "status-active"
        : "status-inactive";

const productNameClass = esgotado
    ? "admin-category-product-name product-out-of-stock"
    : "admin-category-product-name";

                    return `
                        <tr>

                            <td>
                                <button
                                    type="button"
                                    class="${productNameClass} product-preview-button"
                                    data-id="${escapeHtml(product.id)}"
                                    title="Visualizar prévia do produto"
                                >
                                    ${escapeHtml(
                                        product.titulo ||
                                        "Produto"
                                    )}
                                </button>
                            </td>

                            <td>
                                ${formatPrice(product.valor)}
                            </td>

                            <td>
                                ${Number(product.estoque) || 0}
                            </td>

                            <td>
                                <span
                                    class="${statusClass} admin-category-status"
                                >
                                    ${status}
                                </span>
                            </td>

                            <td>

                                <div
                                    class="admin-category-product-actions"
                                >

                                    <button
                                        type="button"
                                        class="admin-category-action preview product-preview-button"
                                        data-id="${escapeHtml(product.id)}"
                                    >
                                        Prévia
                                    </button>

                                    <button
                                        type="button"
                                        class="admin-category-action edit product-edit-button"
                                        data-id="${escapeHtml(product.id)}"
                                    >
                                        Editar
                                    </button>

                                    <button
                                        type="button"
                                        class="admin-category-action delete product-delete-button"
                                        data-id="${escapeHtml(product.id)}"
                                    >
                                        Excluir
                                    </button>

                                </div>

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");

    adminCategoryProductsBody
        .querySelectorAll(".product-preview-button")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const product =
                            products.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );

                        if (product) {
                            showProductPreview(product);
                        }

                    }
                );

            }
        );

    adminCategoryProductsBody
        .querySelectorAll(".product-edit-button")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const product =
                            products.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );

                        if (product) {
                            startEditProduct(product);
                        }

                    }
                );

            }
        );

    adminCategoryProductsBody
        .querySelectorAll(".product-delete-button")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const product =
                            products.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );

                        if (!product) {
                            return;
                        }

                        const confirmed =
                            window.confirm(
                                `Deseja realmente excluir o produto "${product.titulo || "este produto"}"?\n\nEssa ação não poderá ser desfeita.`
                            );

                        if (!confirmed) {
                            return;
                        }

                        button.disabled = true;
                        button.textContent = "Excluindo...";

                        await deleteProduct(
                            product.id
                        );

                    }
                );

            }
        );

}


function showCategoryProducts(categoryId) {

    selectedCategoryId = categoryId;

    if (adminCategoriesList) {
        adminCategoriesList.style.display = "none";
    }

    if (adminCategoryProducts) {
        adminCategoryProducts.style.display = "block";
    }

    if (adminCategoryProductsTitle) {
        adminCategoryProductsTitle.textContent =
            categoryId
                ? getProductCategoryName({ categoriaId: categoryId })
                : "Sem categoria";
    }

    renderCategoryProducts(categoryId);
}


function showAllCategories() {

    selectedCategoryId = null;

    if (adminCategoriesList) {
        adminCategoriesList.style.display = "grid";
    }

    if (adminCategoryProducts) {
        adminCategoryProducts.style.display = "none";
    }
}


async function loadCategories() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "categorias")
            );

        categories = [];

        snapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();

                const nome =
                    normalizeCategoryName(data.nome);

                if (!nome) {
                    return;
                }

                categories.push({
                    id: documentSnapshot.id,
                    ...data,
                    nome
                });
            }
        );

        categories.sort(
            (a, b) => {

                const ordemA = Number(a.ordem ?? 999999);
                const ordemB = Number(b.ordem ?? 999999);

                if (ordemA !== ordemB) {
                    return ordemA - ordemB;
                }

                return a.nome.localeCompare(
                    b.nome,
                    "pt-BR",
                    { sensitivity: "base" }
                );
            }
        );

        populateProductCategorySelect();
        populateMarketingCategorySelects();
        renderCategories();

    } catch (error) {

        console.error(
            "Erro ao carregar categorias:",
            error
        );

        categories = [];
        populateProductCategorySelect();

        if (adminCategoriesList) {
            adminCategoriesList.innerHTML = `
                <div class="admin-category-empty">
                    Não foi possível carregar as categorias. Verifique as regras do Firestore.
                </div>
            `;
        }
    }
}


async function createCategory() {

    const nome =
        normalizeCategoryName(
            newCategoryName?.value
        );

    if (!nome) {
        setNewCategoryMessage(
            "Digite o nome da categoria."
        );
        newCategoryName?.focus();
        return;
    }

    const duplicate =
        categories.some(
            category =>
                normalizeCategoryName(category.nome)
                    .toLowerCase() === nome.toLowerCase()
        );

    if (duplicate) {
        setNewCategoryMessage(
            "Já existe uma categoria com esse nome."
        );
        newCategoryName?.focus();
        return;
    }

    try {

        if (saveNewCategory) {
            saveNewCategory.disabled = true;
            saveNewCategory.textContent = "Criando...";
        }

        const ordem =
            categories.length + 1;

        const newDoc =
            await addDoc(
                collection(db, "categorias"),
                {
                    nome,
                    ordem,
                    ativo: true,
                    dataCadastro: serverTimestamp()
                }
            );

        categories.push({
            id: newDoc.id,
            nome,
            ordem,
            ativo: true
        });

        categories.sort(
            (a, b) => Number(a.ordem ?? 999999) - Number(b.ordem ?? 999999)
        );

        populateProductCategorySelect(newDoc.id);
        renderCategories();

        setNewCategoryMessage(
            "Categoria criada com sucesso.",
            "success"
        );

        window.setTimeout(
            closeNewCategoryModal,
            500
        );

    } catch (error) {

        console.error(
            "Erro ao criar categoria:",
            error
        );

        setNewCategoryMessage(
            "Não foi possível criar a categoria. Verifique as regras do Firestore."
        );

    } finally {

        if (saveNewCategory) {
            saveNewCategory.disabled = false;
            saveNewCategory.textContent = "Criar categoria";
        }
    }
}


if (newCategoryButton) {
    newCategoryButton.addEventListener(
        "click",
        openNewCategoryModal
    );
}


if (newCategoryFromProduct) {
    newCategoryFromProduct.addEventListener(
        "click",
        openNewCategoryModal
    );
}


if (cancelNewCategory) {
    cancelNewCategory.addEventListener(
        "click",
        closeNewCategoryModal
    );
}


if (saveNewCategory) {
    saveNewCategory.addEventListener(
        "click",
        createCategory
    );
}


if (newCategoryName) {
    newCategoryName.addEventListener(
        "keydown",
        event => {
            if (event.key === "Enter") {
                event.preventDefault();
                createCategory();
            }
            if (event.key === "Escape") {
                closeNewCategoryModal();
            }
        }
    );
}


if (newCategoryModal) {
    newCategoryModal.addEventListener(
        "click",
        event => {
            if (event.target === newCategoryModal) {
                closeNewCategoryModal();
            }
        }
    );
}


if (adminCategoryBackButton) {
    adminCategoryBackButton.addEventListener(
        "click",
        showAllCategories
    );
}


// =========================================================
// PRODUTOS
// =========================================================

async function loadProducts() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "produtos"
                )
            );


        products = [];


        snapshot.forEach(
            documentSnapshot => {

                products.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        products.sort(
            (a, b) => {

                return (
                    getTimestampMillis(
                        b.dataCadastro
                    ) -
                    getTimestampMillis(
                        a.dataCadastro
                    )
                );

            }
        );


        if (totalProducts) {

            totalProducts.textContent =
                products.length;

        }
        renderCategories();

        if (selectedCategoryId !== null) {
            renderCategoryProducts(
                selectedCategoryId
            );
        }


    } catch (error) {

        console.error(
            "Erro ao carregar produtos:",
            error
        );


        if (totalProducts) {

            totalProducts.textContent =
                "—";

        }


        showProductMessage(
            "Não foi possível carregar os produtos."
        );

    }

}


// =========================================================
// PRÉVIA DO PRODUTO
// =========================================================

function showProductPreview(
    product
) {

    const oldModal =
        document.getElementById(
            "productPreviewModal"
        );


    if (oldModal) {
        oldModal.remove();
    }


    const images =
        Array.isArray(
            product.imagens
        )
            ? product.imagens.filter(Boolean)
            : [];


    const imagesHtml =
        images.length
            ? images.map(
                image => `

                    <img
                        src="${escapeHtml(
                            image
                        )}"
                        alt="${escapeHtml(
                            product.titulo ||
                            "Produto"
                        )}"
                        style="
                            width:100%;
                            max-width:260px;
                            height:220px;
                            object-fit:contain;
                            border:1px solid #d9e5dc;
                            border-radius:10px;
                            background:#f8f9fa;
                        "
                    >

                `
            ).join("")
            : `

                <div
                    style="
                        padding:40px;
                        text-align:center;
                        border:1px solid #dee2e6;
                        border-radius:10px;
                    "
                >
                    Nenhuma imagem cadastrada.
                </div>

            `;


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "productPreviewModal";


    modal.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(9,20,13,.68);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
        z-index:9999;
        box-sizing:border-box;
        -webkit-overflow-scrolling:touch;
    `;


    modal.innerHTML = `

        <div
            style="
                width:min(900px,100%);
                max-height:min(90vh,900px);
                overflow:auto;
                -webkit-overflow-scrolling:touch;
                background:#fff;
                border-radius:18px;
                padding:clamp(18px,3vw,28px);
                position:relative;
                box-shadow:0 24px 70px rgba(0,0,0,.30);
                box-sizing:border-box;
            "
        >

            <button
                type="button"
                id="closeProductPreview"
                style="
                    position:absolute;
                    top:12px;
                    right:12px;
                    width:38px;
                    height:38px;
                    border:none;
                    border-radius:50%;
                    background:#16803c;
                    color:#fff;
                    font-size:20px;
                    cursor:pointer;
                "
            >
                ×
            </button>


            <h2
                style="
                    margin:0 50px 10px 0;
                    color:#17351f;
                "
            >
                ${escapeHtml(
                    product.titulo ||
                    "Produto"
                )}
            </h2>


            <p
                style="
                    color:#66756b;
                    line-height:1.6;
                "
            >
                ${escapeHtml(
                    product.descricao ||
                    "Sem descrição."
                )}
            </p>


            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(220px,1fr)
                        );
                    gap:15px;
                    margin:20px 0;
                "
            >
                ${imagesHtml}
            </div>


            <div
                style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:20px;
                    border-top:1px solid #d9e5dc;
                    padding-top:18px;
                "
            >

                <strong>
                    Valor:
                    ${formatPrice(
                        product.valor
                    )}
                </strong>

                <strong>
                    Estoque:
                    ${Number(
                        product.estoque
                    ) || 0}
                </strong>

                <strong>
                    Status:
                    ${
                        product.ativo === true
                            ? "Ativo"
                            : "Inativo"
                    }
                </strong>

                <strong>
                    Categoria:
                    ${escapeHtml(
                        getProductCategoryName(product)
                    )}
                </strong>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const closeButton =
        document.getElementById(
            "closeProductPreview"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => modal.remove()
        );

    }


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                modal.remove();

            }

        }
    );

}


// =========================================================
// CONTROLE DO PERCENTUAL DA OFERTA
// =========================================================

function updateOfferPercentState() {
    if (!productOfferPercent) return;
    productOfferPercent.disabled = !productOffer?.checked;
    if (productOffer?.checked && (!productOfferPercent.value || Number(productOfferPercent.value) < 1)) {
        productOfferPercent.value = "10";
    }
}

if (productOffer) {
    productOffer.addEventListener("change", updateOfferPercentState);
}

if (productOfferPercent) {
    productOfferPercent.addEventListener("input", () => {
        let value = Number(productOfferPercent.value);
        if (value > 100) productOfferPercent.value = "100";
        if (value < 1 && productOfferPercent.value !== "") productOfferPercent.value = "1";
    });
}


// =========================================================
// EDITAR PRODUTO
// =========================================================

function startEditProduct(
    product
) {

    editingProductId =
        product.id;


    if (productTitle) {

        productTitle.value =
            product.titulo || "";

    }


    if (productDescription) {

        productDescription.value =
            product.descricao || "";

    }


    if (productPrice) {

        productPrice.value =
            product.valor ?? "";

    }


    if (productStock) {

        productStock.value =
            product.estoque ?? 0;

    }


    if (productCategory) {

        productCategory.value =
            getProductCategoryId(product);

    }


    const images =
        Array.isArray(
            product.imagens
        )
            ? product.imagens
            : [];


    if (productImage1) {

        productImage1.value =
            images[0] || "";

    }


    if (productImage2) {

        productImage2.value =
            images[1] || "";

    }


    if (productImage3) {

        productImage3.value =
            images[2] || "";

    }


    if (productActive) {

        productActive.checked =
            product.ativo === true;

    }

if (productSponsored) {
    productSponsored.checked =
        product.produtoPatrocinado === true;
}

if (productMostViewed) {
    productMostViewed.checked =
        product.produtoMaisVisto === true;
}

if (productYouMayLike) {
    productYouMayLike.checked =
        product.produtoVocePodeGostar === true;
}

if (productBestSelling) {
    productBestSelling.checked =
        product.produtoMaisVendido === true;
}

if (productOffer) {
    productOffer.checked = product.oferta === true;
}

if (productOfferPercent) {
    const percent = Math.min(100, Math.max(1, Number(product.percentualOferta || 10)));
    productOfferPercent.value = Number.isFinite(percent) ? percent : 10;
    productOfferPercent.disabled = !productOffer?.checked;
}
    const submitButton =
        productForm?.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.textContent =
            "Salvar alterações";

    }


    createCancelEditButton();

    updateFormImagePreview();


    openAdminSection(
        "cadastrar-produtos"
    );

}


// =========================================================
// CANCELAR EDIÇÃO
// =========================================================

function createCancelEditButton() {

    if (!productForm) {
        return;
    }


    let cancelButton =
        document.getElementById(
            "cancelProductEdit"
        );


    if (cancelButton) {
        return;
    }


    cancelButton =
        document.createElement(
            "button"
        );


    cancelButton.type =
        "button";


    cancelButton.id =
        "cancelProductEdit";


    cancelButton.textContent =
        "Cancelar edição";


    cancelButton.style.cssText = `
        margin-left:10px;
        border:1px solid #adb5bd;
        background:#fff;
        color:#212529;
        border-radius:6px;
        padding:10px 16px;
        cursor:pointer;
    `;


    cancelButton.addEventListener(
        "click",
        () => {

            clearProductForm();

            showProductMessage(
                ""
            );

        }
    );


    const submitButton =
        productForm.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.insertAdjacentElement(
            "afterend",
            cancelButton
        );

    }

}


// =========================================================
// EXCLUIR PRODUTO
// =========================================================

async function deleteProduct(
    productId
) {

    try {

        await deleteDoc(
            doc(
                db,
                "produtos",
                productId
            )
        );


        showProductMessage(
            "Produto excluído com sucesso.",
            "success"
        );

        await loadProducts();

        if (selectedCategoryId !== null) {
            renderCategoryProducts(
                selectedCategoryId
            );
        }


    } catch (error) {

        console.error(
            "Erro ao excluir produto:",
            error
        );


        showProductMessage(
            "Não foi possível excluir o produto."
        );

    }

}


// =========================================================
// CADASTRAR / ATUALIZAR PRODUTO
// =========================================================

if (productForm) {

    productForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            showProductMessage(
                ""
            );


            const titulo =
                productTitle
                    ?.value
                    .trim() || "";


            const descricao =
                productDescription
                    ?.value
                    .trim() || "";


            const valor =
                Number(
                    productPrice
                        ?.value
                        .replace(",", ".")
                );


            const estoque =
                Number(
                    productStock
                        ?.value
                );


            const imagens = [

                productImage1
                    ?.value
                    .trim() || "",

                productImage2
                    ?.value
                    .trim() || "",

                productImage3
                    ?.value
                    .trim() || ""

            ].filter(Boolean);


            const ativo =
                productActive
                    ? productActive.checked
                    : true;
const produtoPatrocinado =
    productSponsored
        ? productSponsored.checked
        : false;

const produtoMaisVisto =
    productMostViewed
        ? productMostViewed.checked
        : false;

const produtoVocePodeGostar =
    productYouMayLike
        ? productYouMayLike.checked
        : false;

const produtoMaisVendido =
    productBestSelling
        ? productBestSelling.checked
        : false;

const oferta =
    productOffer
        ? productOffer.checked
        : false;

let percentualOferta =
    productOfferPercent
        ? Number(productOfferPercent.value)
        : 10;

if (oferta) {
    if (!Number.isInteger(percentualOferta) || percentualOferta < 1 || percentualOferta > 100) {
        showProductMessage("O percentual da oferta deve estar entre 1 e 100%.");
        productOfferPercent?.focus();
        return;
    }
} else {
    percentualOferta = 0;
}

            const categoriaId =
                productCategory?.value || "";


            if (!titulo) {

                showProductMessage(
                    "Informe o título do produto."
                );

                productTitle?.focus();

                return;

            }


            if (
                !Number.isFinite(valor) ||
                valor < 0
            ) {

                showProductMessage(
                    "Informe um valor válido."
                );

                productPrice?.focus();

                return;

            }


            if (
                !Number.isInteger(
                    estoque
                ) ||
                estoque < 0
            ) {

                showProductMessage(
                    "Informe uma quantidade de estoque válida."
                );

                productStock?.focus();

                return;

            }


            const data = {
    titulo,
    descricao,
    valor,
    estoque,
    imagens,
    ativo,
    categoriaId,
    produtoPatrocinado,
    produtoMaisVisto,
    produtoVocePodeGostar,
    produtoMaisVendido,
    oferta,
    percentualOferta
};

            try {

                const submitButton =
                    productForm.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        editingProductId
                            ? "Salvando..."
                            : "Cadastrando...";

                }


                if (
                    editingProductId
                ) {

                    await updateDoc(
                        doc(
                            db,
                            "produtos",
                            editingProductId
                        ),
                        data
                    );


                    showProductMessage(
                        "Produto atualizado com sucesso.",
                        "success"
                    );


                } else {

                    await addDoc(
                        collection(
                            db,
                            "produtos"
                        ),
                        {

                            ...data,

                            dataCadastro:
                                serverTimestamp()

                        }
                    );


                    showProductMessage(
                        "Produto cadastrado com sucesso.",
                        "success"
                    );

                }


                await loadProducts();
                renderCategories();

                clearProductForm();


            } catch (error) {

                console.error(
                    "Erro ao salvar produto:",
                    error
                );


                showProductMessage(
                    "Não foi possível salvar o produto."
                );


            } finally {

                const submitButton =
                    productForm.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        editingProductId
                            ? "Salvar alterações"
                            : "Cadastrar produto";

                }

            }

        }
    );

}


// =========================================================
// PEDIDOS
// =========================================================


// =========================================================
// STATUS DO PEDIDO
// =========================================================

function getOrderStatus(order) {

    return String(
        order?.status ||
        order?.estado ||
        ""
    )
        .trim()
        .toLowerCase();

}


// =========================================================
// VERIFICAR SE ESTÁ FINALIZADO
// =========================================================

function isOrderFinalized(order) {

    const status =
        getOrderStatus(order);


    return [
        "finalizado",
        "finalizada",
        "concluido",
        "concluida",
        "concluído",
        "concluída"
    ].includes(status);

}


// =========================================================
// DATA DO PEDIDO
// =========================================================

function getOrderDate(order) {

    if (!order) {
        return null;
    }


    return (
        order.dataPedido ||
        order.criadoEm ||
        order.dataCadastro ||
        order.createdAt ||
        order.created_at ||
        null
    );

}


// =========================================================
// NOME DO CLIENTE
// =========================================================

function getOrderClientName(order) {

    if (!order) {
        return "Não informado";
    }


    return (
        order.clienteNome ||
        order.nomeCliente ||
        order.nome ||
        order.cliente?.nome ||
        "Não informado"
    );

}


// =========================================================
// E-MAIL DO CLIENTE
// =========================================================

function getOrderClientEmail(order) {

    if (!order) {
        return "Não informado";
    }


    return (
        order.clienteEmail ||
        order.email ||
        order.cliente?.email ||
        "Não informado"
    );

}


// =========================================================
// TELEFONE DO CLIENTE
// =========================================================

function getOrderClientPhone(order) {

    if (!order) {
        return "Não informado";
    }


    return (
        order.telefone ||
        order.phone ||
        order.cliente?.telefone ||
        "Não informado"
    );

}


// =========================================================
// WHATSAPP DO CLIENTE
// =========================================================

function getOrderClientWhatsapp(order) {

    if (!order) {
        return "Não informado";
    }


    return (
        order.whatsapp ||
        order.cliente?.whatsapp ||
        "Não informado"
    );

}


// =========================================================
// CPF DO CLIENTE
// =========================================================

function getOrderClientCpf(order) {

    if (!order) {
        return "Não informado";
    }


    // -----------------------------------------------------
    // 1. CPF salvo diretamente no pedido
    // -----------------------------------------------------

    const cpfDoPedido =
        order.cpf ||
        order.cliente?.cpf;

    if (cpfDoPedido) {

        return String(
            cpfDoPedido
        );

    }


    // -----------------------------------------------------
    // 2. Procurar o cliente pelo clienteId
    // -----------------------------------------------------

    const clienteId =
        order.clienteId ||
        order.uid ||
        order.userId ||
        order.cliente?.uid;

    if (clienteId) {

        const cliente =
            clients.find(
                client =>
                    client.id === clienteId ||
                    client.uid === clienteId
            );

        if (
            cliente &&
            cliente.cpf
        ) {

            return String(
                cliente.cpf
            );

        }

    }


    // -----------------------------------------------------
    // 3. Caso não encontre pelo ID,
    //    procurar pelo e-mail
    // -----------------------------------------------------

    const emailCliente =
        order.clienteEmail ||
        order.email ||
        order.cliente?.email;

    if (emailCliente) {

        const cliente =
            clients.find(
                client =>
                    String(
                        client.email ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ===
                    String(
                        emailCliente
                    )
                        .trim()
                        .toLowerCase()
            );

        if (
            cliente &&
            cliente.cpf
        ) {

            return String(
                cliente.cpf
            );

        }

    }


    // -----------------------------------------------------
    // 4. Se realmente não encontrar
    // -----------------------------------------------------

    return "Não informado";

}
// =========================================================
// ENDEREÇO DO PEDIDO
// =========================================================

function getOrderAddress(order) {

    if (!order) {
        return "Não informado";
    }


    /*
     * Primeiro usamos o endereço que foi salvo
     * diretamente dentro do pedido.
     *
     * Isso é importante porque o pedido deve
     * conservar o endereço usado no momento
     * da compra.
     */

    if (
        order.enderecoCompleto &&
        String(
            order.enderecoCompleto
        ).trim()
    ) {

        return String(
            order.enderecoCompleto
        );

    }


    const client =
        order.cliente ||
        {};


    const cep =
        order.cep ||
        client.cep ||
        "";


    const endereco =
        order.endereco ||
        order.rua ||
        client.endereco ||
        client.rua ||
        "";


    const numero =
        order.numero ||
        client.numero ||
        "";


    const complemento =
        order.complemento ||
        client.complemento ||
        "";


    const bairro =
        order.bairro ||
        client.bairro ||
        "";


    const cidade =
        order.cidade ||
        client.cidade ||
        "";


    const estado =
        order.estado ||
        client.estado ||
        "";


    const referencia =
        order.referencia ||
        client.referencia ||
        "";


    const partes = [];


    if (endereco) {

        let rua =
            String(
                endereco
            );


        if (numero) {

            rua +=
                ", " +
                String(
                    numero
                );

        }


        partes.push(
            rua
        );

    }


    if (complemento) {

        partes.push(
            "Complemento: " +
            String(
                complemento
            )
        );

    }


    if (bairro) {

        partes.push(
            "Bairro: " +
            String(
                bairro
            )
        );

    }


    if (cidade) {

        let cidadeEstado =
            String(
                cidade
            );


        if (estado) {

            cidadeEstado +=
                " - " +
                String(
                    estado
                );

        }


        partes.push(
            cidadeEstado
        );

    }


    if (cep) {

        partes.push(
            "CEP: " +
            String(
                cep
            )
        );

    }


    if (referencia) {

        partes.push(
            "Referência: " +
            String(
                referencia
            )
        );

    }


    return partes.length
        ? partes.join(" | ")
        : "Não informado";

}


// =========================================================
// ITENS DO PEDIDO
// =========================================================

function getOrderItems(order) {

    if (!order) {
        return [];
    }


    const items =
        order.itens ||
        order.items ||
        order.produtos ||
        [];


    return Array.isArray(
        items
    )
        ? items
        : [];

}


// =========================================================
// NOME DO PRODUTO DO PEDIDO
// =========================================================

function getOrderItemTitle(item) {

    if (!item) {
        return "Produto";
    }


    return (
        item.nome ||
        item.titulo ||
        item.name ||
        item.title ||
        item.produto ||
        "Produto"
    );

}


// =========================================================
// QUANTIDADE DO ITEM
// =========================================================

function getOrderItemQuantity(item) {

    if (!item) {
        return 1;
    }


    const quantity =
        Number(
            item.quantidade ??
            item.qtd ??
            item.quantity ??
            1
        );


    return Number.isFinite(
        quantity
    ) && quantity > 0
        ? quantity
        : 1;

}


// =========================================================
// TOTAL DO PEDIDO
// =========================================================

function getOrderTotal(order) {

    if (!order) {
        return 0;
    }


    return (
        order.total ??
        order.valorTotal ??
        order.totalPedido ??
        order.amount ??
        0
    );

}


// =========================================================
// FINALIZAR PEDIDO + BAIXAR ESTOQUE
// =========================================================

async function finalizeOrder(
    orderId
) {

    const confirmed =
        window.confirm(
            "Deseja realmente finalizar este pedido?\n\n" +
            "Ao finalizar:\n" +
            "- o estoque será baixado;\n" +
            "- o pedido ficará como FINALIZADO;\n" +
            "- se algum produto ficar com estoque 0, ele ficará ESGOTADO no Admin."
        );

    if (!confirmed) {
        return;
    }


    try {

        await runTransaction(
            db,
            async transaction => {

                // -----------------------------------------
                // 1. PEGAR O PEDIDO
                // -----------------------------------------

                const orderRef =
                    doc(
                        db,
                        "pedidos",
                        orderId
                    );

                const orderSnapshot =
                    await transaction.get(
                        orderRef
                    );


                if (!orderSnapshot.exists()) {

                    throw new Error(
                        "PEDIDO_NAO_ENCONTRADO"
                    );

                }


                const order =
                    orderSnapshot.data();


                // -----------------------------------------
                // 2. NÃO BAIXAR DUAS VEZES
                // -----------------------------------------

                if (
                    isOrderFinalized(
                        order
                    )
                ) {

                    throw new Error(
                        "PEDIDO_JA_FINALIZADO"
                    );

                }


                // -----------------------------------------
                // 3. PEGAR OS ITENS DO PEDIDO
                // -----------------------------------------

                const items =
                    getOrderItems(
                        order
                    );


                if (
                    !Array.isArray(items) ||
                    items.length === 0
                ) {

                    throw new Error(
                        "PEDIDO_SEM_ITENS"
                    );

                }


                // -----------------------------------------
                // 4. PREPARAR OS PRODUTOS
                // -----------------------------------------

                const productsToUpdate = [];


                for (
                    const item of items
                ) {

                    const productId =
                        item?.productId ||
                        item?.produtoId ||
                        item?.id ||
                        "";


                    const quantity =
                        getOrderItemQuantity(
                            item
                        );


                    if (!productId) {

                        throw new Error(
                            "PRODUTO_SEM_ID"
                        );

                    }


                    if (
                        !Number.isFinite(
                            quantity
                        ) ||
                        quantity <= 0
                    ) {

                        throw new Error(
                            "QUANTIDADE_INVALIDA"
                        );

                    }


                    const productRef =
                        doc(
                            db,
                            "produtos",
                            String(
                                productId
                            )
                        );


                    const productSnapshot =
                        await transaction.get(
                            productRef
                        );


                    if (
                        !productSnapshot.exists()
                    ) {

                        throw new Error(
                            `PRODUTO_NAO_ENCONTRADO:${productId}`
                        );

                    }


                    const product =
                        productSnapshot.data();


                    const estoqueAtual =
                        Number(
                            product.estoque
                        );


                    if (
                        !Number.isFinite(
                            estoqueAtual
                        ) ||
                        estoqueAtual < 0
                    ) {

                        throw new Error(
                            `ESTOQUE_INVALIDO:${product.titulo || productId}`
                        );

                    }


                    // -----------------------------------------
                    // 5. IMPEDIR ESTOQUE NEGATIVO
                    // -----------------------------------------

                    if (
                        quantity >
                        estoqueAtual
                    ) {

                        throw new Error(
                            `ESTOQUE_INSUFICIENTE:${product.titulo || "Produto"}:${estoqueAtual}:${quantity}`
                        );

                    }


                    const novoEstoque =
                        estoqueAtual -
                        quantity;


                    productsToUpdate.push({

                        ref:
                            productRef,

                        nome:
                            product.titulo ||
                            "Produto",

                        estoqueAtual:
                            estoqueAtual,

                        quantidade:
                            quantity,

                        novoEstoque:
                            novoEstoque

                    });

                }


                // -----------------------------------------
                // 6. BAIXAR O ESTOQUE
                // -----------------------------------------

                productsToUpdate.forEach(
                    product => {

                        transaction.update(
                            product.ref,
                            {
                                estoque:
                                    product.novoEstoque
                            }
                        );

                    }
                );


                // -----------------------------------------
                // 7. FINALIZAR O PEDIDO
                // -----------------------------------------

                transaction.update(
                    orderRef,
                    {
                        status:
                            "finalizado"
                    }
                );

            }
        );


        // -----------------------------------------
        // 8. ATUALIZAR O ADMIN
        // -----------------------------------------

        await loadProducts();

        await loadOrders();


        window.alert(
            "Pedido finalizado com sucesso!\n\n" +
            "O estoque dos produtos foi atualizado."
        );


    } catch (error) {

        console.error(
            "Erro ao finalizar pedido:",
            error
        );


        // -----------------------------------------
        // MENSAGENS MAIS CLARAS
        // -----------------------------------------

        if (
            error.message ===
            "PEDIDO_NAO_ENCONTRADO"
        ) {

            window.alert(
                "Não foi possível finalizar: pedido não encontrado."
            );

            return;

        }


        if (
            error.message ===
            "PEDIDO_JA_FINALIZADO"
        ) {

            window.alert(
                "Este pedido já foi finalizado anteriormente."
            );

            return;

        }


        if (
            error.message ===
            "PEDIDO_SEM_ITENS"
        ) {

            window.alert(
                "Não foi possível finalizar: o pedido não possui produtos."
            );

            return;

        }


        if (
            error.message ===
            "PRODUTO_SEM_ID"
        ) {

            window.alert(
                "Não foi possível finalizar: existe um produto no pedido sem identificação."
            );

            return;

        }


        if (
            error.message ===
            "QUANTIDADE_INVALIDA"
        ) {

            window.alert(
                "Não foi possível finalizar: existe uma quantidade inválida no pedido."
            );

            return;

        }


        if (
            error.message.startsWith(
                "PRODUTO_NAO_ENCONTRADO:"
            )
        ) {

            const productId =
                error.message.split(
                    ":"
                )[1];

            window.alert(
                "Não foi possível finalizar.\n\n" +
                "O produto do pedido não foi encontrado no cadastro.\n\n" +
                "ID: " +
                productId
            );

            return;

        }


        if (
            error.message.startsWith(
                "ESTOQUE_INSUFICIENTE:"
            )
        ) {

            const parts =
                error.message.split(
                    ":"
                );

            const nome =
                parts[1] ||
                "Produto";

            const disponivel =
                parts[2] ||
                "0";

            const solicitado =
                parts[3] ||
                "0";


            window.alert(
                "ESTOQUE INSUFICIENTE!\n\n" +
                "Produto: " +
                nome +
                "\n" +
                "Estoque disponível: " +
                disponivel +
                "\n" +
                "Quantidade solicitada: " +
                solicitado +
                "\n\n" +
                "O pedido NÃO foi finalizado."
            );

            return;

        }


        window.alert(
            "Não foi possível finalizar o pedido.\n\n" +
            "O pedido NÃO foi finalizado e o estoque NÃO foi alterado."
        );

    }

}

// =========================================================
// EXCLUIR PEDIDO
// =========================================================

async function deleteOrder(
    order
) {

    if (!order) {
        return;
    }


    const mensagem =
        isOrderFinalized(
            order
        )

            ? "ATENÇÃO!\n\n" +
              "Este pedido está FINALIZADO.\n\n" +
              "Deseja excluir definitivamente este pedido?\n\n" +
              "Essa ação não poderá ser desfeita."

            : "ATENÇÃO!\n\n" +
              "Este pedido está PENDENTE.\n\n" +
              "Deseja excluir definitivamente este pedido?\n\n" +
              "Essa ação não poderá ser desfeita.";


    const confirmed =
        window.confirm(
            mensagem
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "pedidos",
                order.id
            )
        );


        window.alert(
            "Pedido excluído definitivamente."
        );


        await loadOrders();


    } catch (error) {

        console.error(
            "Erro ao excluir pedido:",
            error
        );


        window.alert(
            "Não foi possível excluir o pedido."
        );

    }

}


// =========================================================
// RENDERIZAR PEDIDOS
// =========================================================

function renderOrders(
    list,
    filter = "todos"
) {

    const section =
        document.getElementById(
            "pedidos"
        );


    if (!section) {
        return;
    }


    let container =
        document.getElementById(
            "adminOrdersContainer"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "adminOrdersContainer";


        section.appendChild(
            container
        );

    }


    const filtered =
        filter === "finalizados"

            ? list.filter(
                order =>
                    isOrderFinalized(
                        order
                    )
            )

            : list;


    container.innerHTML = `

        <div
            style="
                margin-top:20px;
            "
        >

            <!-- FILTROS -->

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    flex-wrap:wrap;
                    gap:10px;
                    margin-bottom:18px;
                "
            >

                <div>

                    <strong>
                        ${filtered.length}
                    </strong>

                    pedido(s)

                </div>


                <div
                    style="
                        display:flex;
                        gap:8px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        type="button"
                        id="ordersFilterAll"
                        style="
                            border:1px solid #16803c;
                            background:${
                                filter === "todos"
                                    ? "#16803c"
                                    : "#fff"
                            };
                            color:${
                                filter === "todos"
                                    ? "#fff"
                                    : "#16803c"
                            };
                            border-radius:7px;
                            padding:8px 14px;
                            cursor:pointer;
                            font-weight:700;
                        "
                    >
                        Todos
                    </button>


                    <button
                        type="button"
                        id="ordersFilterFinalized"
                        style="
                            border:1px solid #16803c;
                            background:${
                                filter === "finalizados"
                                    ? "#16803c"
                                    : "#fff"
                            };
                            color:${
                                filter === "finalizados"
                                    ? "#fff"
                                    : "#16803c"
                            };
                            border-radius:7px;
                            padding:8px 14px;
                            cursor:pointer;
                            font-weight:700;
                        "
                    >
                        Finalizados
                    </button>

                </div>

            </div>


            ${
                filtered.length === 0

                    ? `

                        <div
                            style="
                                padding:30px;
                                text-align:center;
                                border:1px solid #d9e5dc;
                                border-radius:10px;
                                background:#fff;
                            "
                        >

                            Nenhum pedido encontrado.

                        </div>

                    `

                    : `

                        <div
                            style="
                                overflow-x:auto;
                                background:#fff;
                                border:1px solid #d9e5dc;
                                border-radius:10px;
                            "
                        >

                            <table
                                style="
                                    width:100%;
                                    border-collapse:collapse;
                                    min-width:900px;
                                "
                            >

                                <thead>

                                    <tr>

                                        <th
                                            style="
                                                padding:12px;
                                                text-align:left;
                                                border-bottom:1px solid #d9e5dc;
                                            "
                                        >
                                            Pedido
                                        </th>


                                        <th
                                            style="
                                                padding:12px;
                                                text-align:left;
                                                border-bottom:1px solid #d9e5dc;
                                            "
                                        >
                                            Cliente
                                        </th>


                                        <th
                                            style="
                                                padding:12px;
                                                text-align:left;
                                                border-bottom:1px solid #d9e5dc;
                                            "
                                        >
                                            Data
                                        </th>


                                        <th
                                            style="
                                                padding:12px;
                                                text-align:left;
                                                border-bottom:1px solid #d9e5dc;
                                            "
                                        >
                                            Itens
                                        </th>


                                        <th
                                            style="
                                                padding:12px;
                                                text-align:left;
                                                border-bottom:1px solid #d9e5dc;
                                            "
                                        >
                                            Total
                                        </th>


                                        <th
                                            style="
                                                padding:12px;
                                                text-align:left;
                                                border-bottom:1px solid #d9e5dc;
                                            "
                                        >
                                            Status
                                        </th>


                                        <th
                                            style="
                                                padding:12px;
                                                text-align:left;
                                                border-bottom:1px solid #d9e5dc;
                                            "
                                        >
                                            Ações
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    ${
                                        filtered
                                            .map(
                                                order => {

                                                    const items =
                                                        getOrderItems(
                                                            order
                                                        );


                                                    const itemCount =
                                                        items.reduce(
                                                            (
                                                                total,
                                                                item
                                                            ) =>
                                                                total +
                                                                getOrderItemQuantity(
                                                                    item
                                                                ),
                                                            0
                                                        );


                                                    const finalized =
                                                        isOrderFinalized(
                                                            order
                                                        );


                                                    const statusText =
                                                        finalized
                                                            ? "Finalizado"
                                                            : "Pendente";


                                                    return `

                                                        <tr>

                                                            <!-- PEDIDO -->

                                                            <td
                                                                style="
                                                                    padding:12px;
                                                                    border-bottom:1px solid #eee;
                                                                    font-weight:700;
                                                                "
                                                            >

                                                                ${escapeHtml(
                                                                    order.id
                                                                )}

                                                            </td>


                                                            <!-- CLIENTE -->

                                                            <td
                                                                style="
                                                                    padding:12px;
                                                                    border-bottom:1px solid #eee;
                                                                "
                                                            >

                                                                ${escapeHtml(
                                                                    getOrderClientName(
                                                                        order
                                                                    )
                                                                )}

                                                            </td>


                                                            <!-- DATA -->

                                                            <td
                                                                style="
                                                                    padding:12px;
                                                                    border-bottom:1px solid #eee;
                                                                    white-space:nowrap;
                                                                "
                                                            >

                                                                ${formatDateTime(
                                                                    getOrderDate(
                                                                        order
                                                                    )
                                                                )}

                                                            </td>


                                                            <!-- ITENS -->

                                                            <td
                                                                style="
                                                                    padding:12px;
                                                                    border-bottom:1px solid #eee;
                                                                "
                                                            >

                                                                ${itemCount}

                                                            </td>


                                                            <!-- TOTAL -->

                                                            <td
                                                                style="
                                                                    padding:12px;
                                                                    border-bottom:1px solid #eee;
                                                                    white-space:nowrap;
                                                                "
                                                            >

                                                                ${formatPrice(
                                                                    getOrderTotal(
                                                                        order
                                                                    )
                                                                )}

                                                            </td>


                                                            <!-- STATUS -->

                                                            <td
                                                                style="
                                                                    padding:12px;
                                                                    border-bottom:1px solid #eee;
                                                                "
                                                            >

                                                                <span
                                                                    style="
                                                                        display:inline-block;
                                                                        border:1px solid ${
                                                                            finalized
                                                                                ? "#15803d"
                                                                                : "#d97706"
                                                                        };
                                                                        background:${
                                                                            finalized
                                                                                ? "#eaf7ef"
                                                                                : "#fff7ed"
                                                                        };
                                                                        color:${
                                                                            finalized
                                                                                ? "#15803d"
                                                                                : "#b45309"
                                                                        };
                                                                        border-radius:6px;
                                                                        padding:7px 12px;
                                                                        font-weight:700;
                                                                    "
                                                                >

                                                                    ${statusText}

                                                                </span>

                                                            </td>


                                                            <!-- AÇÕES -->

                                                            <td
                                                                style="
                                                                    padding:12px;
                                                                    border-bottom:1px solid #eee;
                                                                "
                                                            >

                                                                <div
                                                                    style="
                                                                        display:flex;
                                                                        gap:7px;
                                                                        flex-wrap:wrap;
                                                                        align-items:center;
                                                                    "
                                                                >

                                                                    <!-- DETALHES -->

                                                                    <button
                                                                        type="button"
                                                                        class="order-details-button"
                                                                        data-id="${escapeHtml(
                                                                            order.id
                                                                        )}"
                                                                        style="
                                                                            border:1px solid #16803c;
                                                                            background:#fff;
                                                                            color:#16803c;
                                                                            border-radius:6px;
                                                                            padding:7px 12px;
                                                                            cursor:pointer;
                                                                            font-weight:700;
                                                                        "
                                                                    >
                                                                        Detalhes
                                                                    </button>


                                                                    ${
                                                                        finalized

                                                                            ? `

                                                                                <span
                                                                                    style="
                                                                                        display:inline-block;
                                                                                        border:1px solid #15803d;
                                                                                        background:#eaf7ef;
                                                                                        color:#15803d;
                                                                                        border-radius:6px;
                                                                                        padding:7px 12px;
                                                                                        font-weight:700;
                                                                                    "
                                                                                >
                                                                                    Finalizado
                                                                                </span>

                                                                            `

                                                                            : `

                                                                                <button
                                                                                    type="button"
                                                                                    class="order-finalize-button"
                                                                                    data-id="${escapeHtml(
                                                                                        order.id
                                                                                    )}"
                                                                                    style="
                                                                                        border:1px solid #15803d;
                                                                                        background:#15803d;
                                                                                        color:#fff;
                                                                                        border-radius:6px;
                                                                                        padding:7px 12px;
                                                                                        cursor:pointer;
                                                                                        font-weight:700;
                                                                                    "
                                                                                >
                                                                                    Finalizar
                                                                                </button>

                                                                            `
                                                                    }


                                                                    <!-- EXCLUIR -->

                                                                    <button
                                                                        type="button"
                                                                        class="order-delete-button"
                                                                        data-id="${escapeHtml(
                                                                            order.id
                                                                        )}"
                                                                        style="
                                                                            border:1px solid #dc2626;
                                                                            background:#dc2626;
                                                                            color:#fff;
                                                                            border-radius:6px;
                                                                            padding:7px 12px;
                                                                            cursor:pointer;
                                                                            font-weight:700;
                                                                        "
                                                                    >
                                                                        Excluir
                                                                    </button>

                                                                </div>

                                                            </td>

                                                        </tr>

                                                    `;

                                                }
                                            )
                                            .join("")
                                    }

                                </tbody>

                            </table>

                        </div>

                    `
            }

        </div>

    `;


    // =========================================================
    // FILTRO TODOS
    // =========================================================

    const allButton =
        document.getElementById(
            "ordersFilterAll"
        );


    if (allButton) {

        allButton.addEventListener(
            "click",
            () => {

                renderOrders(
                    orders,
                    "todos"
                );

            }
        );

    }


    // =========================================================
    // FILTRO FINALIZADOS
    // =========================================================

    const finalizedButton =
        document.getElementById(
            "ordersFilterFinalized"
        );


    if (finalizedButton) {

        finalizedButton.addEventListener(
            "click",
            () => {

                renderOrders(
                    orders,
                    "finalizados"
                );

            }
        );

    }


    // =========================================================
    // DETALHES
    // =========================================================

    container
        .querySelectorAll(
            ".order-details-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const order =
                            orders.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );


                        if (!order) {
                            return;
                        }


                        showOrderDetails(
                            order
                        );

                    }
                );

            }
        );


    // =========================================================
    // FINALIZAR
    // =========================================================

    container
        .querySelectorAll(
            ".order-finalize-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const order =
                            orders.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );


                        if (!order) {
                            return;
                        }


                        await finalizeOrder(
                            order.id
                        );

                    }
                );

            }
        );


    // =========================================================
    // EXCLUIR
    // =========================================================

    container
        .querySelectorAll(
            ".order-delete-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const order =
                            orders.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );


                        if (!order) {
                            return;
                        }


                        await deleteOrder(
                            order
                        );

                    }
                );

            }
        );

}


// =========================================================
// DETALHES COMPLETOS DO PEDIDO
// =========================================================

function showOrderDetails(
    order
) {

    const oldModal =
        document.getElementById(
            "orderDetailsModal"
        );


    if (oldModal) {
        oldModal.remove();
    }


    const items =
        getOrderItems(
            order
        );


    const address =
        getOrderAddress(
            order
        );


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "orderDetailsModal";


    modal.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.65);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        z-index:10000;
    `;


    modal.innerHTML = `

        <div
            style="
                width:min(900px,100%);
                max-height:90vh;
                overflow:auto;
                background:#fff;
                border-radius:18px;
                padding:28px;
                position:relative;
                box-shadow:0 20px 60px rgba(0,0,0,.25);
            "
        >

            <!-- FECHAR -->

            <button
                type="button"
                id="closeOrderDetails"
                style="
                    position:absolute;
                    top:12px;
                    right:12px;
                    width:40px;
                    height:40px;
                    border:none;
                    border-radius:50%;
                    background:#16803c;
                    color:#fff;
                    font-size:22px;
                    cursor:pointer;
                "
            >
                ×
            </button>


            <!-- TÍTULO -->

            <div
                style="
                    border-bottom:1px solid #e5e7eb;
                    padding-bottom:18px;
                    margin-bottom:22px;
                "
            >

                <span
                    style="
                        color:#16803c;
                        font-size:12px;
                        font-weight:800;
                        letter-spacing:.08em;
                    "
                >
                    DETALHES DO PEDIDO
                </span>


                <h2
                    style="
                        margin:6px 50px 4px 0;
                        color:#17351f;
                    "
                >

                    Pedido
                    #${escapeHtml(
                        order.id
                    )}

                </h2>

            </div>


            <!-- DADOS DO CLIENTE -->

            <h3
                style="
                    margin:0 0 14px;
                    color:#17351f;
                "
            >
                Dados do cliente
            </h3>


            <div
                style="
                    display:grid;
                    grid-template-columns:repeat(
                        auto-fit,
                        minmax(220px,1fr)
                    );
                    gap:12px;
                "
            >

                ${clientInfoCard(
                    "Cliente",
                    getOrderClientName(
                        order
                    )
                )}


                ${clientInfoCard(
                    "E-mail",
                    getOrderClientEmail(
                        order
                    )
                )}


                ${clientInfoCard(
                    "Telefone",
                    getOrderClientPhone(
                        order
                    )
                )}


                ${clientInfoCard(
                    "WhatsApp",
                    getOrderClientWhatsapp(
                        order
                    )
                )}


                ${clientInfoCard(
                    "CPF",
                    getOrderClientCpf(
                        order
                    )
                )}


                ${clientInfoCard(
                    "Data do pedido",
                    formatDateTime(
                        getOrderDate(
                            order
                        )
                    )
                )}


                ${clientInfoCard(
                    "Status",
                    isOrderFinalized(
                        order
                    )
                        ? "Finalizado"
                        : "Pendente"
                )}


                ${clientInfoCard(
                    "Total",
                    formatPrice(
                        getOrderTotal(
                            order
                        )
                    )
                )}

            </div>


            <!-- ENDEREÇO -->

            <div
                style="
                    margin-top:22px;
                    padding:20px;
                    border-radius:12px;
                    background:#eaf7ef;
                    border:1px solid #cce8d5;
                "
            >

                <h3
                    style="
                        margin:0 0 8px;
                        color:#17351f;
                    "
                >
                    Endereço completo para entrega
                </h3>


                <p
                    style="
                        margin:0;
                        color:#17351f;
                        line-height:1.7;
                        word-break:break-word;
                    "
                >

                    ${escapeHtml(
                        address
                    )}

                </p>

            </div>


            <!-- ENDEREÇO SEPARADO -->

            <div
                style="
                    margin-top:18px;
                "
            >

                <h3
                    style="
                        margin:0 0 14px;
                        color:#17351f;
                    "
                >
                    Dados do endereço
                </h3>


                <div
                    style="
                        display:grid;
                        grid-template-columns:repeat(
                            auto-fit,
                            minmax(200px,1fr)
                        );
                        gap:12px;
                    "
                >

                    ${clientInfoCard(
                        "CEP",
                        order.cep ||
                        order.cliente?.cep ||
                        "Não informado"
                    )}


                    ${clientInfoCard(
                        "Rua / Avenida",
                        order.endereco ||
                        order.rua ||
                        order.cliente?.endereco ||
                        "Não informado"
                    )}


                    ${clientInfoCard(
                        "Número",
                        order.numero ||
                        order.cliente?.numero ||
                        "Não informado"
                    )}


                    ${clientInfoCard(
                        "Complemento",
                        order.complemento ||
                        order.cliente?.complemento ||
                        "Não informado"
                    )}


                    ${clientInfoCard(
                        "Bairro",
                        order.bairro ||
                        order.cliente?.bairro ||
                        "Não informado"
                    )}


                    ${clientInfoCard(
                        "Cidade",
                        order.cidade ||
                        order.cliente?.cidade ||
                        "Não informado"
                    )}


                    ${clientInfoCard(
                        "Estado",
                        order.estado ||
                        order.cliente?.estado ||
                        "Não informado"
                    )}


                    ${clientInfoCard(
                        "Ponto de referência",
                        order.referencia ||
                        order.cliente?.referencia ||
                        "Não informado"
                    )}

                </div>

            </div>


            <!-- PRODUTOS -->

            <div
                style="
                    margin-top:24px;
                "
            >

                <h3
                    style="
                        margin:0 0 14px;
                        color:#17351f;
                    "
                >
                    Produtos do pedido
                </h3>


                <div
                    style="
                        display:grid;
                        gap:10px;
                    "
                >

                    ${
                        items.length === 0

                            ? `

                                <div
                                    style="
                                        padding:16px;
                                        border:1px solid #d9e5dc;
                                        border-radius:10px;
                                    "
                                >
                                    Nenhum item registrado.
                                </div>

                            `

                            : items
                                .map(
                                    item => `

                                        <div
                                            style="
                                                display:flex;
                                                justify-content:space-between;
                                                align-items:center;
                                                gap:15px;
                                                border:1px solid #d9e5dc;
                                                border-radius:10px;
                                                padding:14px;
                                            "
                                        >

                                            <div>

                                                <strong>
                                                    ${escapeHtml(
                                                        getOrderItemTitle(
                                                            item
                                                        )
                                                    )}
                                                </strong>

                                            </div>


                                            <strong
                                                style="
                                                    white-space:nowrap;
                                                "
                                            >

                                                ${getOrderItemQuantity(
                                                    item
                                                )}

                                                un.

                                            </strong>

                                        </div>

                                    `
                                )
                                .join("")
                    }

                </div>

            </div>


            <!-- TOTAL -->

            <div
                style="
                    margin-top:22px;
                    padding-top:18px;
                    border-top:1px solid #e5e7eb;
                    display:flex;
                    justify-content:flex-end;
                "
            >

                <strong
                    style="
                        font-size:20px;
                        color:#16803c;
                    "
                >

                    Total:
                    ${formatPrice(
                        getOrderTotal(
                            order
                        )
                    )}

                </strong>

            </div>


        </div>

    `;


    document.body.appendChild(
        modal
    );


    // =========================================================
    // FECHAR
    // =========================================================

    const closeButton =
        document.getElementById(
            "closeOrderDetails"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );

    }


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                modal.remove();

            }

        }
    );

}


// =========================================================
// CARREGAR PEDIDOS
// =========================================================

async function loadOrders() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "pedidos"
                )
            );


        orders = [];


        snapshot.forEach(
            documentSnapshot => {

                orders.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        // =====================================================
        // ORDENAR MAIS RECENTES PRIMEIRO
        // =====================================================

        orders.sort(
            (
                a,
                b
            ) => {

                return (
                    getTimestampMillis(
                        getOrderDate(
                            b
                        )
                    ) -
                    getTimestampMillis(
                        getOrderDate(
                            a
                        )
                    )
                );

            }
        );


        // =====================================================
        // ATUALIZAR CONTADOR
        // =====================================================

        const quantidadePedidos =
            snapshot.size;


        const contadorPedidos =
            document.getElementById(
                "totalOrders"
            );


        if (contadorPedidos) {

            contadorPedidos.textContent =
                String(
                    quantidadePedidos
                );

        }


        document
            .querySelectorAll(
                "#totalOrders"
            )
            .forEach(
                elemento => {

                    elemento.textContent =
                        String(
                            quantidadePedidos
                        );

                }
            );


        // =====================================================
        // RENDERIZAR
        // =====================================================

        renderOrders(
            orders,
            "todos"
        );


    } catch (error) {

        console.error(
            "Erro ao carregar pedidos:",
            error
        );


        const contadorPedidos =
            document.getElementById(
                "totalOrders"
            );


        if (contadorPedidos) {

            contadorPedidos.textContent =
                "—";

        }


        document
            .querySelectorAll(
                "#totalOrders"
            )
            .forEach(
                elemento => {

                    elemento.textContent =
                        "—";

                }
            );


        const container =
            document.getElementById(
                "adminOrdersContainer"
            );


        if (container) {

            container.innerHTML = `

                <div
                    style="
                        padding:30px;
                        text-align:center;
                        color:#dc2626;
                        background:#fff;
                        border:1px solid #fecaca;
                        border-radius:10px;
                    "
                >

                    Não foi possível carregar os pedidos.

                </div>

            `;

        }

    }

}



// =========================================================
// MENU ADMINISTRATIVO
// =========================================================

const adminMenuButton =
    document.querySelector(
        ".admin-menu-button"
    );


const adminMenuOverlay =
    document.querySelector(
        ".admin-menu-overlay"
    );


const adminSidebar =
    document.querySelector(
        ".admin-sidebar"
    );


function openAdminMenu() {

    if (adminSidebar) {

        adminSidebar.classList.add(
            "open"
        );

    }


    if (adminMenuOverlay) {

        adminMenuOverlay.classList.add(
            "open"
        );

    }


    if (adminMenuButton) {

        adminMenuButton.classList.add(
            "active"
        );

        adminMenuButton.setAttribute(
            "aria-expanded",
            "true"
        );

    }

}


function closeAdminMenu() {

    if (adminSidebar) {

        adminSidebar.classList.remove(
            "open"
        );

    }


    if (adminMenuOverlay) {

        adminMenuOverlay.classList.remove(
            "open"
        );

    }


    if (adminMenuButton) {

        adminMenuButton.classList.remove(
            "active"
        );

        adminMenuButton.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


function toggleAdminMenu() {

    const isOpen =
        adminSidebar?.classList.contains(
            "open"
        );


    if (isOpen) {

        closeAdminMenu();

    } else {

        openAdminMenu();

    }

}


if (adminMenuButton) {

    adminMenuButton.addEventListener(
        "click",
        toggleAdminMenu
    );

}


if (adminMenuOverlay) {

    adminMenuOverlay.addEventListener(
        "click",
        closeAdminMenu
    );

}


// =========================================================
// LINKS MENU
// =========================================================

const adminNavLinks =
    document.querySelectorAll(
        ".admin-nav-link"
    );


adminNavLinks.forEach(
    link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const sectionId =
                    link.dataset.section;


                if (!sectionId) {
                    return;
                }


                if (
                    sectionId ===
                    "cadastrar-produtos"
                ) {

                    clearProductForm();

                }


                openAdminSection(
                    sectionId
                );

            }
        );

    }
);


// =========================================================
// BOTÕES VOLTAR
// =========================================================

document
    .querySelectorAll(
        "[data-back-dashboard]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    goToDashboard();

                }
            );

        }
    );


document
    .querySelectorAll(
        "[data-admin-back]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    goToDashboard();

                }
            );

        }
    );


// =========================================================
// LOGO
// =========================================================

const adminLogo =
    document.querySelector(
        ".admin-logo"
    );

if (adminLogo) {
    adminLogo.addEventListener(
        "click",
        event => {
            event.preventDefault();
            event.stopPropagation();

            openAdminSection(
                "dashboard"
            );
        }
    );
}

// =========================================================
// AUTENTICAÇÃO
// =========================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        try {

            await user.getIdToken(
                true
            );


            const tokenResult =
                await user.getIdTokenResult();


            const isAdmin =
                tokenResult
                    .claims
                    .admin === true;


            if (!isAdmin) {

                await signOut(
                    auth
                );


                window.location.href =
                    "login.html";

                return;

            }


            await loadCategories();

            await Promise.all([

                loadClients(),
                loadProducts(),
                loadOrders()

            ]);
            await loadDeliverySettings();
            await loadFooterSettings();

const dashboardOrders =
    document.getElementById("totalOrders");

if (dashboardOrders) {
    dashboardOrders.textContent =
        orders.length;
}


        } catch (error) {

            console.error(
                "Erro na autenticação administrativa:",
                error
            );


            await signOut(
                auth
            );


            window.location.href =
                "login.html";

        }

    }
);


// =========================================================
// SAIR
// =========================================================

if (adminLogoutButton) {

    adminLogoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );


                window.location.href =
                    "index.html";


            } catch (error) {

                console.error(
                    "Erro ao sair:",
                    error
                );


                showMessage(
                    "Não foi possível sair da conta."
                );

            }

        }
    );

}


// =========================================================
// INICIALIZAÇÃO
// =========================================================

clearProductForm();


// =========================================================
// CARDS DO DASHBOARD
// =========================================================

function setupDashboardNavigation() {

    // CLIENTES
    const dashboardClientsCard =
        document.querySelector(
            "#totalClients"
        )?.closest(
            ".admin-stat-card"
        );

    if (dashboardClientsCard) {
        dashboardClientsCard.style.cursor = "pointer";

        dashboardClientsCard.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopPropagation();

                openAdminSection(
                    "clientes"
                );
            }
        );
    }


    // PRODUTOS
    const dashboardProductsCard =
        document.querySelector(
            "#totalProducts"
        )?.closest(
            ".admin-stat-card"
        );

    if (dashboardProductsCard) {
        dashboardProductsCard.style.cursor = "pointer";

        dashboardProductsCard.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopPropagation();

                openAdminSection(
                    "produtos"
                );
            }
        );
    }


    // PEDIDOS
    const dashboardOrdersCard =
        document.getElementById(
            "dashboardOrdersCard"
        );

    if (dashboardOrdersCard) {
        dashboardOrdersCard.style.cursor = "pointer";

        dashboardOrdersCard.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopPropagation();

                openAdminSection(
                    "pedidos"
                );
            }
        );
    }


    // CADASTRAR PRODUTO
    const dashboardRegisterProductCard =
        document.getElementById(
            "dashboardRegisterProductCard"
        );

    if (dashboardRegisterProductCard) {
        dashboardRegisterProductCard.style.cursor = "pointer";

        dashboardRegisterProductCard.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopPropagation();

                clearProductForm();

                openAdminSection(
                    "cadastrar-produtos"
                );
            }
        );
    }


    // MARKETINK
    const dashboardMarketingCard =
        document.getElementById(
            "dashboardMarketingCard"
        );

    if (dashboardMarketingCard) {
        dashboardMarketingCard.style.cursor = "pointer";

        dashboardMarketingCard.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopPropagation();

                openAdminSection(
                    "marketing"
                );
            }
        );
    }


    // RODAPÉ
    const dashboardFooterCard = document.getElementById("dashboardFooterCard");
    if (dashboardFooterCard) {
        dashboardFooterCard.style.cursor = "pointer";
        dashboardFooterCard.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); openAdminSection("rodape"); });
        dashboardFooterCard.addEventListener("keydown", event => { if(event.key === "Enter" || event.key === " "){ event.preventDefault(); openAdminSection("rodape"); } });
    }


    // FRETE
    const dashboardDeliveryCard =
        document.getElementById(
            "dashboardDeliveryCard"
        );

    if (dashboardDeliveryCard) {
        dashboardDeliveryCard.style.cursor = "pointer";

        dashboardDeliveryCard.addEventListener(
            "click",
            event => {
                event.preventDefault();
                event.stopPropagation();

                openAdminSection(
                    "configuracoes"
                );
            }
        );

        dashboardDeliveryCard.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    openAdminSection(
                        "configuracoes"
                    );
                }
            }
        );
    }
}


// Inicializar navegação do Dashboard
setupDashboardNavigation();
