// Datos iniciales: claves para el localStorage (persistencia local)
const LS_PRODUCTS = 'kizzezProducts_v2';
const LS_ORDERS = 'kizzezOrders_v2';
const LS_ACTIVITY = 'kizzezActivity_v2';
const LS_COUPONS = 'kizzezCoupons_v2';

// --------------------
// Helpers / utilidades
// --------------------

// selector corto
const $ = q => document.querySelector(q);
// selector multiple corto (devuelve array)
const $$ = q => Array.from(document.querySelectorAll(q));

// Mostrar un toast (notificación pequeña) usando Bootstrap
// title: texto principal, body: texto secundario, type: 'success'|'danger'|'warning'...
const toast = (title, body='', type='success') => {
    const id = 't' + Date.now();
    const el = document.createElement('div');
    // Clase para estilos (Bootstrap)
    el.className = `toast align-items-center text-bg-${type} border-0`;
    el.role = 'alert';
    el.ariaLive = 'polite';
    el.ariaAtomic = 'true';
    el.id = id;
    // Usar escapeHtml para evitar inyección
    el.innerHTML = `
        <div class="d-flex">
        <div class="toast-body">${escapeHtml(title)}${body ? `<div class="small">${escapeHtml(body)}</div>` : ''}</div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>`;
    document.getElementById('toastContainer').appendChild(el);
    const bs = new bootstrap.Toast(el, { delay: 3000 });
    bs.show();
    // Remover del DOM cuando desaparece
    el.addEventListener('hidden.bs.toast', () => el.remove());
};

// Escapa caracteres especiales para mostrar en HTML seguro
function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]; });
}

// ------------------------------
// Inicializar datos de ejemplo
// ------------------------------
// Si no hay datos en localStorage, crea ejemplos para productos, pedidos, actividad y cupones
function ensureInitialData() {
    if (!localStorage.getItem(LS_PRODUCTS)) {
        const sampleProducts = [
        // Productos de ejemplo (id, nombre, descripción, precio, stock, categoría, imagen, estado)
        { id:1, name:"Café Expresso Doble", desc:"Doble shot de nuestro café premium", price:12.00, stock:15, category:"bebidas-calientes", image:"", status:"active" },
        { id:2, name:"Café Expresso", desc:"Intenso y aromático", price:7.00, stock:20, category:"bebidas-calientes", image:"", status:"active" },
        { id:3, name:"Café Capuchino", desc:"Perfecto balance entre espresso y leche", price:15.00, stock:18, category:"bebidas-calientes", image:"", status:"active" },
        { id:4, name:"Café Latte", desc:"Suave y cremoso", price:9.00, stock:22, category:"bebidas-calientes", image:"", status:"active" },
        { id:5, name:"Chocolate Caliente", desc:"Chocolate belga y leche cremosa", price:15.00, stock:12, category:"bebidas-calientes", image:"", status:"active" },
        { id:6, name:"Café Mochaccino", desc:"Chocolate + café", price:14.00, stock:16, category:"bebidas-calientes", image:"", status:"active" }
        ];
        localStorage.setItem(LS_PRODUCTS, JSON.stringify(sampleProducts));
    }
    if (!localStorage.getItem(LS_ORDERS)) {
        const sampleOrders = [
        // Pedidos de ejemplo (id, cliente, items, total, estado, fecha)
        { id: 101, customer: "María López", items:[{productId:3,q:1}], total:45.00, status:"completed", date: "2025-08-28T12:45:00Z" },
        { id: 102, customer: "Carlos Ruiz", items:[{productId:2,q:2}], total:32.50, status:"on_way", date: "2025-08-28T13:15:00Z" },
        { id: 103, customer: "Ana Mendoza", items:[{productId:1,q:1}], total:28.00, status:"preparing", date: "2025-08-28T14:30:00Z" },
        ];
        localStorage.setItem(LS_ORDERS, JSON.stringify(sampleOrders));
    }
    // Activity y coupons vacíos por defecto si no existen
    if (!localStorage.getItem(LS_ACTIVITY)) localStorage.setItem(LS_ACTIVITY, JSON.stringify([]));
    if (!localStorage.getItem(LS_COUPONS)) localStorage.setItem(LS_COUPONS, JSON.stringify([]));
}

// --------------------
// Modelos: lectura/escritura en localStorage
// --------------------
// Funciones simples para obtener y guardar arrays en localStorage
function readProducts() { return JSON.parse(localStorage.getItem(LS_PRODUCTS) || '[]'); }
function writeProducts(arr) { localStorage.setItem(LS_PRODUCTS, JSON.stringify(arr)); }
function readOrders() { return JSON.parse(localStorage.getItem(LS_ORDERS) || '[]'); }
function writeOrders(arr) { localStorage.setItem(LS_ORDERS, JSON.stringify(arr)); }
function readActivity() { return JSON.parse(localStorage.getItem(LS_ACTIVITY) || '[]'); }
function writeActivity(arr) { localStorage.setItem(LS_ACTIVITY, JSON.stringify(arr)); }
function readCoupons() { return JSON.parse(localStorage.getItem(LS_COUPONS) || '[]'); }
function writeCoupons(arr) { localStorage.setItem(LS_COUPONS, JSON.stringify(arr)); }

// Añade un registro al log de actividad (usa pushActivity para auditar acciones administrativas)
function pushActivity(text) {
    const a = readActivity();
    // Insertar al inicio (más reciente primero)
    a.unshift({ time: new Date().toISOString(), text });
    // Limitar tamaño del log a 200 registros
    if (a.length > 200) a.pop();
    writeActivity(a);
    renderActivity(); // actualizar vista
}

// Etiquetas legibles para categorías internas
const CATEGORY_LABELS = {
    'bebidas-calientes': 'Bebidas Calientes',
    'bebidas-frias': 'Bebidas Frías',
    'postres': 'Postres',
    'sandwiches': 'Sandwiches'
};

// --------------------
// Render / Vistas
// --------------------

// Render de la tabla de productos con filtros (búsqueda por texto, categoría y estado)
function renderProductsTable(filterText='', filterCat='', filterStatus='') {
    const tbody = $('#products-table-body');
    tbody.innerHTML = '';
    let products = readProducts();

    // Filtrado por texto (nombre o descripción)
    if (filterText) {
        const ft = filterText.toLowerCase();
        products = products.filter(p => p.name.toLowerCase().includes(ft) || (p.desc||'').toLowerCase().includes(ft));
    }
    // Filtrado por categoría y estado
    if (filterCat) products = products.filter(p => p.category === filterCat);
    if (filterStatus) products = products.filter(p => p.status === filterStatus);

    // Si no hay resultados, mostrar mensaje
    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">No se encontraron productos</td></tr>`;
        return;
    }

    // Crear filas para cada producto
    products.forEach(p => {
        // Imagen por defecto si no hay
        const img = p.image || '../Cafeteria-zz/img/cafe_productos.png';
        const tr = document.createElement('tr');
        tr.innerHTML = `
        <td><img src="${escapeAttr(img)}" alt="Imagen ${escapeAttr(p.name)}" class="product-image-preview"></td>
        <td class="fw-semibold"><div class="product-name"></div><div class="small text-muted product-desc"></div></td>
        <td class="product-cat"></td>
        <td class="text-gold product-price"></td>
        <td class="product-stock"></td>
        <td class="product-status"></td>
        <td class="text-end">
            <button class="btn btn-sm btn-outline-primary me-1 btn-view" data-id="${p.id}" title="Ver"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-outline-warning me-1 btn-edit" data-id="${p.id}" title="Editar"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${p.id}" title="Eliminar"><i class="bi bi-trash"></i></button>
        </td>`;

        // Rellenar campos de texto de forma segura
        tr.querySelector('.product-name').textContent = p.name;
        tr.querySelector('.product-desc').textContent = p.desc || '';
        tr.querySelector('.product-cat').textContent = CATEGORY_LABELS[p.category] || p.category;
        tr.querySelector('.product-price').textContent = 'S/ ' + Number(p.price).toFixed(2);
        // Indicador 'Bajo' si stock <= 5
        tr.querySelector('.product-stock').innerHTML = `${Number(p.stock)} ${p.stock <= 5 ? '<span class="badge badge-stock-low ms-2">Bajo</span>' : ''}`;
        tr.querySelector('.product-status').innerHTML = p.status === 'active' ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-secondary">Inactivo</span>';

        tbody.appendChild(tr);
    });

    // Adjuntar eventos a botones (editar, eliminar, ver)
    // Nota: esto vuelve a buscar elementos en el DOM; se puede optimizar con delegación
    $$('.btn-edit').forEach(btn => btn.addEventListener('click', e => {
        const id = Number(e.currentTarget.dataset.id);
        openEditProduct(id);
    }));
    $$('.btn-delete').forEach(btn => btn.addEventListener('click', e => {
        const id = Number(e.currentTarget.dataset.id);
        if (confirm('¿Eliminar producto? Esta acción no se puede deshacer.')) {
        deleteProduct(id);
        }
    }));
    $$('.btn-view').forEach(btn => btn.addEventListener('click', e => {
        const id = Number(e.currentTarget.dataset.id);
        viewProduct(id);
    }));
}

// Escapa comillas para atributos HTML
function escapeAttr(s){ return String(s).replace(/\"/g,'&quot;'); }

// Render de la tabla de pedidos (orders)
function renderOrdersTable(filterStatus='') {
    const tbody = $('#orders-table-body');
    tbody.innerHTML = '';
    let orders = readOrders();
    if (filterStatus) orders = orders.filter(o => o.status === filterStatus);

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">No se encontraron pedidos</td></tr>`;
        return;
    }

    const STATUS_LABELS = { pending:'Pendiente', preparing:'Preparando', on_way:'En camino', completed:'Completado' };

    // Crear fila por pedido
    orders.forEach(o => {
        const tr = document.createElement('tr');
        const dateText = o.date ? new Date(o.date).toLocaleString('es-PE') : '-';
        tr.innerHTML = `
        <td>#${o.id}</td>
        <td>${escapeHtml(o.customer)}</td>
        <td>${(o.items||[]).length}</td>
        <td class="text-gold">S/ ${Number(o.total||0).toFixed(2)}</td>
        <td>
            <select class="form-select form-select-sm order-status" data-id="${o.id}">
            <option value="pending">Pendiente</option>
            <option value="preparing">Preparando</option>
            <option value="on_way">En camino</option>
            <option value="completed">Completado</option>
            </select>
        </td>
        <td>
            <button class="btn btn-sm btn-outline-primary me-1 btn-view-order" data-id="${o.id}"><i class="bi bi-eye"></i></button>
            <button class="btn btn-sm btn-outline-danger btn-delete-order" data-id="${o.id}"><i class="bi bi-trash"></i></button>
        </td>`;
        tbody.appendChild(tr);

        // Ajustar valor del select al estado actual del pedido
        const sel = tbody.querySelector(`select.order-status[data-id='${o.id}']`);
        if (sel) sel.value = o.status || 'pending';
    });

    // Cambiar estado del pedido al seleccionar otra opción
    $$('.order-status').forEach(sel => sel.addEventListener('change', e => {
        const id = Number(e.currentTarget.dataset.id);
        changeOrderStatus(id, e.currentTarget.value);
    }));

    // Eliminar pedido
    $$('.btn-delete-order').forEach(btn => btn.addEventListener('click', e => {
        const id = Number(e.currentTarget.dataset.id);
        if (confirm('¿Eliminar pedido?')) {
        deleteOrder(id);
        }
    }));

    // Ver detalles del pedido en modal
    $$('.btn-view-order').forEach(btn => btn.addEventListener('click', e => {
        const id = Number(e.currentTarget.dataset.id);
        const order = readOrders().find(x=>x.id===id);
        if (!order) return;
        const html = `
        <div><strong>Pedido #${order.id}</strong></div>
        <div>Cliente: ${escapeHtml(order.customer)}</div>
        <div>Total: S/ ${Number(order.total||0).toFixed(2)}</div>
        <div>Estado: ${STATUS_LABELS[order.status] || order.status}</div>
        <div class="mt-2"><strong>Items:</strong></div>
        <ul>${(order.items||[]).map(it => {
            // Buscar nombre del producto por productId (mostrar ID si no existe)
            const p = readProducts().find(px => px.id === it.productId);
            return `<li>${escapeHtml(p ? p.name : ('ID ' + it.productId))} x ${it.q || 1}</li>`;
        }).join('')}</ul>`;
        $('#viewModalTitle').textContent = `Pedido #${order.id}`;
        $('#viewModalBody').innerHTML = html;
        new bootstrap.Modal($('#viewModal')).show();
    }));
}

// Render del log de actividad (acciones administrativas)
function renderActivity() {
    const container = $('#activityLog') || $('#activityFeed');
    if (!container) return;
    const list = readActivity();
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<div class="text-center py-3 small text-muted">No hay actividad registrada</div>';
        return;
    }

    // Mostrar cada entrada con fecha y texto (más reciente primero)
    list.forEach(a => {
        const d = new Date(a.time);
        const el = document.createElement('div');
        el.className = 'activity-item mb-2 p-2 rounded-2 border';
        el.innerHTML = `<div class="small text-muted">${d.toLocaleString('es-PE')}</div><div>${escapeHtml(a.text)}</div>`;
        container.appendChild(el);
    });
}

// Render de alertas (por ejemplo, stock bajo)
function renderAlerts() {
    const alerts = [];
    const products = readProducts();
    products.forEach(p => { 
        if (p.stock <= 5) alerts.push(`Stock bajo: ${p.name} (${p.stock})`); 
    });

    const ul = $('#alertsList');
    ul.innerHTML = '';

    if (alerts.length === 0) {
        ul.innerHTML = '<div class="small text-muted p-2 border rounded">Sin alertas</div>';
    } else {
        alerts.forEach(a => {
        const li = document.createElement('li');
        li.className = 'mb-2 p-2 border rounded bg-light';
        li.innerHTML = `<div class="small text-danger"><i class="bi bi-exclamation-circle-fill me-1"></i>${escapeHtml(a)}</div>`;
        ul.appendChild(li);
        });
    }
}

// --------------------
// Dashboard: estadísticas y resumen
// --------------------
function renderDashboard() {
    const products = readProducts();
    const orders = readOrders();
    const totalOrders = orders.length;
    // todayLocal compara por fecha local YYYY-MM-DD
    const todayLocal = new Date().toISOString().slice(0,10);
    const ordersToday = orders.filter(o => o.date && o.date.startsWith(todayLocal)).length;
    const revenue = orders.reduce((s,o)=>s+Number(o.total||0),0);
    const avg = totalOrders ? (revenue/totalOrders) : 0;
    const stockTotal = products.reduce((s,p)=>s + (Number(p.stock)||0),0);

    // Actualizar indicadores en la UI
    $('#stat-orders').textContent = totalOrders;
    $('#stat-orders-today').textContent = ordersToday;
    $('#stat-revenue').textContent = 'S/ ' + revenue.toFixed(2);
    $('#stat-avg').textContent = 'S/ ' + avg.toFixed(2);
    $('#stat-products').textContent = products.length;
    $('#stat-stock').textContent = stockTotal;
    // Satisfacción simulada (mock)
    $('#stat-sat').textContent = (Math.floor(80 + (Math.random()*20))) + '%';

    // Recientes: mostrar últimos pedidos en dashboard
    const recTbody = $('#dashboard-recent-orders');
    recTbody.innerHTML = '';

    if (orders.length === 0) {
        recTbody.innerHTML = '<tr><td colspan="5" class="text-center py-3">No hay pedidos recientes</td></tr>';
    } else {
        orders.slice().reverse().slice(0,6).forEach(o => {
        const tr = document.createElement('tr');
        const STATUS_LABELS = { pending:'Pendiente', preparing:'Preparando', on_way:'En camino', completed:'Completado' };
        tr.innerHTML = `<td>#${o.id}</td><td>${escapeHtml(o.customer)}</td><td class="text-gold">S/ ${Number(o.total||0).toFixed(2)}</td><td>${escapeHtml(STATUS_LABELS[o.status] || o.status)}</td><td>${new Date(o.date).toLocaleString('es-PE')}</td>`;
        recTbody.appendChild(tr);
        });
    }

    // Actualizar alertas y actividad
    renderAlerts();
    renderActivity();
}

// --------------------
// Chart: ventas por producto
// --------------------
let salesChart;
function renderSalesChart() {
    const products = readProducts();
    const orders = readOrders();
    const salesMap = new Map();
    // Inicializar mapa con productos (aunque no tengan ventas)
    products.forEach(p => salesMap.set(p.name, 0));
    // Sumar cantidades vendidas según órdenes
    orders.forEach(o => {
        (o.items||[]).forEach(it => {
        const p = products.find(x => x.id === it.productId);
        if (p) salesMap.set(p.name, (salesMap.get(p.name)||0) + (it.q || 1));
        });
    });

    const labels = Array.from(salesMap.keys());
    const data = Array.from(salesMap.values());
    const ctx = document.getElementById('salesChart');
    const fallback = document.getElementById('salesChartFallback');

    if (!ctx) return;

    // Ocultar mensaje fallback por defecto
    fallback.classList.add('visually-hidden');
    ctx.style.display = '';

    // Si ya existe gráfico, destruirlo para recrear
    if (salesChart) salesChart.destroy();

    // Si no hay ventas, mostrar mensaje alternativo
    if (data.every(val => val === 0)) {
        ctx.style.display = 'none';
        fallback.classList.remove('visually-hidden');
        return;
    }

    // Leer color desde variables CSS para mantener consistencia visual
    const cssColor = getComputedStyle(document.documentElement).getPropertyValue('--color-gold') || 'rgba(184,145,70,0.9)';

    // Crear gráfico con Chart.js (barra)
    salesChart = new Chart(ctx, {
        type: 'bar',
        data: {
        labels,
        datasets:[{ 
            label: 'Unidades vendidas', 
            data, 
            backgroundColor: cssColor.trim(),
            borderColor: cssColor.trim(),
            borderWidth: 1
        }]
        },
        options: {
        responsive: true,
        plugins: { 
            legend: { display: false },
            tooltip: {
            callbacks: {
                label: function(context) {
                return `Ventas: ${context.raw} unidades`;
                }
            }
            }
        },
        scales: {
            y: { 
            beginAtZero: true,
            ticks: {
                stepSize: 1
            }
            }
        }
        }
    });
}

// --------------------
// CRUD Productos
// --------------------

// Abrir modal para agregar producto (pre-llenar valores por defecto)
function openAddProductModal() {
    $('#productModalTitle').textContent = 'Agregar producto';
    $('#productId').value = '';
    $('#productName').value = '';
    $('#productDesc').value = '';
    $('#productPrice').value = '';
    $('#productCategory').value = 'bebidas-calientes';
    $('#productStock').value = 1;
    $('#productImage').value = '';
    $('#productActive').checked = true;
    const m = new bootstrap.Modal($('#productModal'));
    m.show();
}

// Abrir modal para editar producto (cargar datos existentes)
function openEditProduct(id) {
    const p = readProducts().find(x=>x.id===id);
    if (!p) return toast('Producto no encontrado', '', 'danger');
    $('#productModalTitle').textContent = 'Editar producto';
    $('#productId').value = p.id;
    $('#productName').value = p.name;
    $('#productDesc').value = p.desc || '';
    $('#productPrice').value = p.price;
    $('#productCategory').value = p.category || 'bebidas-calientes';
    $('#productStock').value = p.stock;
    $('#productImage').value = p.image||'';
    $('#productActive').checked = p.status === 'active';
    const m = new bootstrap.Modal($('#productModal'));
    m.show();
}

// Ver producto (modal con detalle)
function viewProduct(id) {
    const p = readProducts().find(x=>x.id===id);
    if (!p) return;
    const html = `
        <div class="d-flex gap-3">
        <img src="${escapeAttr(p.image || 'https://via.placeholder.com/160x120?text=Producto')}" alt="${escapeAttr(p.name)}" style="width:120px;height:90px;object-fit:cover;border-radius:6px;">
        <div>
            <div class="fw-semibold">${escapeHtml(p.name)}</div>
            <div class="small text-muted">${escapeHtml(p.desc||'')}</div>
            <div class="mt-2">Precio: <strong>S/ ${Number(p.price).toFixed(2)}</strong></div>
            <div>Stock: ${Number(p.stock)}</div>
        </div>
        </div>`;
    $('#viewModalTitle').textContent = p.name;
    $('#viewModalBody').innerHTML = html;
    new bootstrap.Modal($('#viewModal')).show();
}

// Guardar producto desde el formulario (crear o actualizar)
function saveProductFromForm(e) {
    e.preventDefault();
    const id = Number($('#productId').value) || null;
    const name = $('#productName').value.trim();
    const desc = $('#productDesc').value.trim();
    const price = parseFloat($('#productPrice').value) || 0;
    const category = $('#productCategory').value;
    const stock = parseInt($('#productStock').value) || 0;
    const image = $('#productImage').value.trim();
    const status = $('#productActive').checked ? 'active' : 'inactive';

    // Validaciones básicas
    if (!name) return toast('Nombre requerido', 'El producto debe tener un nombre', 'warning');
    if (price <= 0) return toast('Precio inválido', 'El precio debe ser mayor a 0', 'warning');
    if (stock < 0) return toast('Stock inválido', 'El stock no puede ser negativo', 'warning');

    let products = readProducts();
    if (id) {
        // Editar producto existente
        const idx = products.findIndex(p=>p.id===id);
        if (idx === -1) return toast('Producto no encontrado', '', 'danger');
        products[idx] = { ...products[idx], name, desc, price, category, stock, image, status };
        pushActivity(`Producto editado: ${name} (ID ${id})`);
        toast('Producto actualizado', name);
    } else {
        // Crear nuevo producto (generar id incremental)
        const newId = products.length ? Math.max(...products.map(p=>p.id)) + 1 : 1;
        const newProd = { id:newId, name, desc, price, category, stock, image, status };
        products.push(newProd);
        pushActivity(`Producto creado: ${name} (ID ${newId})`);
        toast('Producto creado', name);
    }
    // Guardar y actualizar vistas
    writeProducts(products);
    renderProductsTable($('#searchInput').value, $('#filterCategory').value, $('#filterStatus').value);
    renderDashboard();
    renderSalesChart();
    bootstrap.Modal.getInstance($('#productModal')).hide();
}

// Eliminar producto por id
function deleteProduct(id) {
    let products = readProducts();
    const p = products.find(x=>x.id===id);
    if (!p) return;

    products = products.filter(x=>x.id !== id);
    writeProducts(products);
    pushActivity(`Producto eliminado: ${p.name} (ID ${id})`);
    toast('Producto eliminado', p.name);
    renderProductsTable($('#searchInput').value, $('#filterCategory').value, $('#filterStatus').value);
    renderDashboard();
    renderSalesChart();
}

// --------------------
// Acciones sobre pedidos
// --------------------

// Cambiar estado del pedido y registrar actividad
function changeOrderStatus(id, status) {
    let orders = readOrders();
    const idx = orders.findIndex(o=>o.id===id);
    if (idx === -1) return;
    orders[idx].status = status;
    writeOrders(orders);
    pushActivity(`Pedido #${id} cambiado a ${status}`);
    toast('Estado actualizado', 'Pedido #' + id);
    renderOrdersTable($('#ordersFilter').value);
    renderDashboard();
}

// Eliminar pedido y registrar actividad
function deleteOrder(id) {
    let orders = readOrders();
    const order = orders.find(o=>o.id===id);
    if (!order) return;

    orders = orders.filter(o=>o.id !== id);
    writeOrders(orders);
    pushActivity('Pedido eliminado: #' + id);
    toast('Pedido eliminado', '#' + id);
    renderOrdersTable($('#ordersFilter').value);
    renderDashboard();
}

// --------------------
// Cupones (Coupons)
// --------------------

// Render de la lista de cupones en la UI (tabla)
function renderCoupons() {
    const tbody = $('#couponsBody');
    tbody.innerHTML = '';
    const coupons = readCoupons();

    if (coupons.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No hay cupones registrados</td></tr>';
        return;
    }

    // Mostrar cada cupón con botón para eliminar
    coupons.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(c.code)}</td><td>${Number(c.discount)}%</td><td>${escapeHtml(c.expiry)}</td><td><button class="btn btn-sm btn-outline-danger btn-del-coupon" data-code="${escapeAttr(c.code)}">Eliminar</button></td>`;
        tbody.appendChild(tr);
    });

    // Evento: eliminar cupón
    $$('.btn-del-coupon').forEach(btn => btn.addEventListener('click', e => {
        const code = e.currentTarget.dataset.code;
        if (!confirm('¿Eliminar cupón ' + code + '?')) return;
        const arr = readCoupons().filter(x=>x.code !== code);
        writeCoupons(arr);
        pushActivity('Cupón eliminado: ' + code);
        renderCoupons();
    }));
}

// --------------------
// Export / Import
// --------------------

// Exportar productos a CSV (descarga)
function exportProductsCSV() {
    const products = readProducts();
    if (products.length === 0) {
        toast('No hay productos para exportar', '', 'warning');
        return;
    }

    // Construir filas CSV con manejo de comillas
    const rows = products.map(p => [p.id, p.name, p.desc || '', p.category, p.price, p.stock, p.status].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','));
    const csv = 'ID,Nombre,Descripción,Categoría,Precio,Stock,Estado\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'kizzez_products_' + new Date().toISOString().slice(0,10) + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    pushActivity('Exportó productos a CSV');
    toast('Exportado', 'CSV generado');
}

// --------------------
// UI wiring / eventos al cargar el documento
// --------------------
document.addEventListener('DOMContentLoaded', () => {
    // Asegurar que haya datos iniciales
    ensureInitialData();

    // Navegación lateral: mostrar/ocultar secciones
    $$('.admin-nav').forEach(btn => {
        if (btn.id !== 'btn-logout-side') {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const sec = e.currentTarget.dataset.section;

            // Ocultar todas las secciones
            $$('.section').forEach(s => {
            s.style.display = 'none';
            s.classList.remove('active');
            });

            // Mostrar la sección seleccionada
            const target = $(`#${sec}`);
            if (target) {
            target.style.display = 'block';
            target.classList.add('active');
            }

            // Actualizar estado activo en la navegación
            $$('.admin-nav').forEach(n => n.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Actualizar vistas según la sección visible
            if (sec === 'dashboard') { 
            renderDashboard(); 
            renderSalesChart(); 
            }
            if (sec === 'products') renderProductsTable($('#searchInput').value, $('#filterCategory').value, $('#filterStatus').value);
            if (sec === 'orders') renderOrdersTable($('#ordersFilter').value);
            if (sec === 'activity') renderActivity();
            if (sec === 'coupons') renderCoupons();
        });
        }
    });

    // Inicializar vistas por defecto al cargar la página
    renderProductsTable();
    renderOrdersTable();
    renderDashboard();
    renderSalesChart();
    renderActivity();

    // Buscador y filtros (búsqueda con debounce para no recargar cada tecla)
    let searchTimer = null;
    $('#searchInput').addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => renderProductsTable($('#searchInput').value, $('#filterCategory').value, $('#filterStatus').value), 250);
    });
    // Filtros por categoría y estado
    $('#filterCategory').addEventListener('change', () => renderProductsTable($('#searchInput').value, $('#filterCategory').value, $('#filterStatus').value));
    $('#filterStatus').addEventListener('change', () => renderProductsTable($('#searchInput').value, $('#filterCategory').value, $('#filterStatus').value));
    // Filtro de pedidos
    $('#ordersFilter').addEventListener('change', () => renderOrdersTable($('#ordersFilter').value));

    // Botones para abrir modal de producto (alta rápida)
    $('#openAddBtn').addEventListener('click', openAddProductModal);
    $('#quickAddProduct').addEventListener('click', openAddProductModal);

    // Guardar producto desde formulario
    $('#productForm').addEventListener('submit', saveProductFromForm);

    // Exportar CSV
    $('#exportCsvBtn').addEventListener('click', exportProductsCSV);
    // Botón para actualizar manualmente datos en pantalla
    $('#refreshDataBtn').addEventListener('click', () => { 
        renderDashboard(); 
        renderSalesChart(); 
        toast('Datos actualizados'); 
    });

    // Botón volver al sitio público (redirect)
    $('#back-to-site').addEventListener('click', () => { 
        toast('Redirigiendo al sitio público...');
        // pequeña pausa visual para que se vea el toast
        setTimeout(() => { window.location.href = 'index.html'; }, 400);
    });

    // Logout: confirmar y redirigir a login
    $('#btn-logout, #btn-logout-side').forEach(el => {
        el.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) { 
            toast('Sesión cerrada', 'Redirigiendo...'); 
            setTimeout(() => { window.location.href='login.html'; }, 400);
        }
        });
    });

    // Modal para crear cupones: establecer fecha mínima como hoy
    $('#createCouponBtn').addEventListener('click', () => {
        const today = new Date().toISOString().split('T')[0];
        $('#couponExpiry').setAttribute('min', today);
        $('#couponExpiry').value = today;
        new bootstrap.Modal($('#couponModal')).show();
    });

    // Guardar cupón desde formulario
    $('#couponForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const code = $('#couponCode').value.trim().toUpperCase();
        const discount = Number($('#couponDiscount').value);
        const expiry = $('#couponExpiry').value;

        // Validaciones básicas
        if (!code || !discount || !expiry) {
        return toast('Completa todos los campos', '', 'warning');
        }

        if (discount < 1 || discount > 100) {
        return toast('Descuento inválido', 'El descuento debe estar entre 1% y 100%', 'warning');
        }

        const coupons = readCoupons();

        // Verificar duplicado
        if (coupons.some(c => c.code === code)) {
        return toast('Código ya existe', 'El código de cupón ya está en uso', 'warning');
        }

        coupons.push({ code, discount, expiry });
        writeCoupons(coupons);
        pushActivity('Cupón creado: ' + code);
        renderCoupons();
        toast('Cupón creado', code);
        bootstrap.Modal.getInstance($('#couponModal')).hide();
    });

    // Limpiar el registro de actividad (confirmación previa)
    $('#clearActivityBtn')?.addEventListener('click', () => {
        if (!confirm('¿Borrar todo el registro de actividad? Esta acción no se puede deshacer.')) return;
        writeActivity([]);
        renderActivity();
        toast('Registro limpio');
    });

    // Formularios de configuración: sliders y contacto (no persisten, solo toast de confirmación)
    $('#sliderForm').addEventListener('submit', (e) => {
        e.preventDefault();
        toast('Configuración guardada', 'Slider actualizado correctamente');
    });

    $('#contactForm').addEventListener('submit', (e) => {
        e.preventDefault();
        toast('Configuración guardada', 'Información de contacto actualizada');
    });
});
