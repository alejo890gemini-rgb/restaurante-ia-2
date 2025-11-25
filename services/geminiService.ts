import { GoogleGenAI, Type } from "@google/genai";
import type { PaymentMethod, MenuItem, Table, Sale, InventoryItem, Order, User, InventoryUnit, Customer, ShoppingListItem, LoyaltyReward, ProfeLocoActionResponse, ProfeLocoAction, View, ExpenseCategory, ParsedOrder, ParsedOrderItem, ParsedCustomerInfo, MenuEngineeringItem, ParsedVoiceCommand, ReportData, ParsedInventoryCommand, ShoppingList, ProfeLocoResponse } from '../types';
import { formatPrice } from "../utils/formatPrice";
import { SALSAS_ALITAS, SALSAS_PAPAS } from "../constants";

declare const process: any;

const getAiClient = (specificKey?: string) => {
  // 1. Use specific key if provided (for testing connection)
  if (specificKey) {
      try {
          return new GoogleGenAI({ apiKey: specificKey });
      } catch (e) { return null; }
  }

  // 2. Try LocalStorage (User configured in App Settings) - PRIORITY
  const localKey = localStorage.getItem('GEMINI_API_KEY');
  if (localKey) {
      try {
          return new GoogleGenAI({ apiKey: localKey });
      } catch (e) { 
          console.error("Invalid LocalStorage Key");
      }
  }

  // 3. Fallback to Env (Dev/Deployment)
  const envKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';
  
  if (envKey) {
      try {
          return new GoogleGenAI({ apiKey: envKey });
      } catch (e) { console.error("Invalid Env Key"); }
  }

  console.error("Gemini API Key not found in LocalStorage or process.env.");
  return null;
};

const handleGeminiError = (error: unknown, defaultMessage: string): string => {
    console.error("Gemini API Error:", error);
    let errorDetails: { code?: number; message?: string } = {};
    try {
        if (typeof error === 'string') {
            const parsed = JSON.parse(error);
            errorDetails = parsed.error || { message: error };
        } else if (error instanceof Error) {
            try {
                const parsed = JSON.parse(error.message);
                errorDetails = parsed.error || { message: error.message };
            } catch (e) {
                errorDetails.message = error.message;
            }
        } else if (typeof error === 'object' && error !== null) {
            if ('error' in error && typeof (error as any).error === 'object') {
                errorDetails = (error as any).error;
            } else if ('message' in error) {
                 errorDetails.message = (error as any).message;
                 if ('code' in error) errorDetails.code = (error as any).code;
            }
        }
    } catch (e) {}

    const statusCode = errorDetails.code;
    const message = errorDetails.message || JSON.stringify(error);

    if (statusCode === 429 || message.includes('429') || message.toLowerCase().includes('quota') || message.toLowerCase().includes('resource_exhausted')) {
        return "La IA está recibiendo muchas solicitudes. Por favor, espera un momento y vuelve a intentarlo.";
    }
    return defaultMessage;
};

export const validateConnection = async (testKey?: string): Promise<boolean> => {
    const ai = getAiClient(testKey);
    if (!ai) return false;
    try {
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'test connection',
        });
        return true;
    } catch (e) {
        console.error("Validation failed", e);
        return false;
    }
};

const APP_MANUAL_CONTEXT = `
# MANUAL DE ENTRENAMIENTO: RESTAURANTE IA PRO (Versión "Mente Maestra")

Eres "Profe Loco", el cerebro digital del restaurante. Tu personalidad es enérgica, experta y un poco divertida (como un chef apasionado).
Tu misión es ayudar al usuario a gestionar su negocio usando IA.

## 🏢 NUEVA ARQUITECTURA: MULTI-SEDE (Multi-Branch)
El sistema ahora soporta múltiples locales. Es vital que entiendas esto:
- **Sedes Independientes:** Cada local tiene su propia contabilidad, inventario y ventas. Los empleados de una sede NO ven datos de otra.
- **Super Admin (Dueño):** Tiene "Visión de Dios". En el Dashboard, puede ver un resumen global de ventas o filtrar por una sede específica.
- **Gestión:** Se crean nuevas sedes en "Configuración > Sedes". Los usuarios se asignan a una sede al crearlos.

## 🚀 TUS SUPERPODERES (ACCIONES DIRECTAS)
Puedes ejecutar estas acciones si el usuario te lo pide (por voz o texto):
1. **Gastos:** "Añade gasto de 50k en arriendo". (Usa tool: addExpense)
2. **Inventario:** "Crea ingrediente Tomate a 2000 el kilo". (Usa tool: addInventoryItem)
3. **Navegación:** "Llévame al marketing", "Ir a mesas", "Ver reportes". (Usa tool: navigateToView)
4. **Datos Rápidos:** "¿Cuánto vendimos hoy?". (Usa tool: getQuickStats)

## 🧠 MÓDULOS ESTRATÉGICOS (TU ESPECIALIDAD)

### 1. 📢 Marketing IA (Fidelización)
- **Objetivo:** Recuperar y fidelizar clientes automáticamente.
- **Segmentación:**
    - 💤 **Dormidos:** No vienen hace 30 días. (Mensaje: "Te extrañamos, vuelve por un postre").
    - 💎 **VIP:** Top 20% de gasto. (Mensaje: "Gracias por ser fan, tienes un regalo").
    - 🆕 **Nuevos:** 1 visita. (Mensaje: "Bienvenido a la familia").
- **Tu Rol:** Tú redactas los mensajes de WhatsApp para que sean persuasivos y divertidos.

### 2. 📊 Ingeniería de Menú (Rentabilidad)
- **Ubicación:** Reportes > Ingeniería de Menú.
- **Matriz de Boston (4 Cuadrantes):**
    - ⭐ **Estrellas:** Alta Venta / Alto Margen. (Estrategia: Cuidar calidad, no tocar).
    - 🐄 **Vacas Lecheras:** Alta Venta / Bajo Margen. (Estrategia: Subir precio o reducir porción).
    - ❓ **Incógnitas:** Baja Venta / Alto Margen. (Estrategia: Marketing, mejores fotos).
    - 🐕 **Perros:** Baja Venta / Bajo Margen. (Estrategia: Eliminar del menú).
- **Tu Rol:** Analizas esta matriz y das recomendaciones estratégicas.

### 3. 📱 Menú QR + IA (Atención al Cliente)
- **Gestor:** En "Menú QR" se descarga el código para las mesas.
- **Vista Pública:** Los clientes escanean y ven el menú digital.
- **Chatbot Clientes:** En el menú público, hay una IA (tú mismo) que recomienda platos a los comensales (ej: "Soy vegano, ¿qué como?").

### 4. 🎙️ Recetas con Voz ("Secreto del Chef")
- En "Gestión de Menú", el chef puede grabar notas de audio explicando la preparación.
- Ayuda a estandarizar la cocina para que todos los platos sepan igual.

### 5. 👁️ Inventario Visual
- El usuario puede usar la cámara en "Inventario" para tomar fotos a la estantería.
- La IA cuenta los productos y sugiere el stock.

## ⚙️ OPERACIÓN DIARIA
- **POS:** Punto de venta. Soporta "Importar de WhatsApp" (Pegar chat y la IA arma el pedido).
- **Monitor de Cocina:** Pantalla con alertas de colores (Verde/Naranja/Rojo) según urgencia.
- **Delivery Pro:** Tablero Kanban (Cotización -> Cocina -> Ruta).

Si te preguntan algo que no sabes, responde con creatividad basándote en ser un experto en restaurantes.
`;

export const getProfeLocoActionOrResponse = async (
    query: string,
    chatHistory: { role: 'user' | 'model', parts: { text: string }[] }[]
): Promise<ProfeLocoActionResponse> => {
    const ai = getAiClient();
    if (!ai) return { type: 'text', text: "¡Ay caramba! No puedo pensar sin mi API Key de Gemini. Configúrala en Ajustes." };

    const tools = [
        {
            functionDeclarations: [
                {
                    name: 'addExpense',
                    description: 'Registra un nuevo gasto en el sistema.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            description: { type: Type.STRING, description: 'Descripción clara del gasto (ej: "Compra de papas", "Pago de nómina").' },
                            amount: { type: Type.NUMBER, description: 'Monto del gasto en pesos colombianos.' },
                            category: { type: Type.STRING, description: 'Categoría del gasto.', enum: ['Proveedores', 'Nómina', 'Arriendo', 'Servicios', 'Marketing', 'Impuestos', 'Mantenimiento', 'Varios'] }
                        },
                        required: ['description', 'amount', 'category']
                    }
                },
                {
                    name: 'addInventoryItem',
                    description: 'Añade un nuevo producto al inventario del restaurante.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: 'Nombre del producto (ej: "Tomates", "Harina").' },
                            stock: { type: Type.NUMBER, description: 'Cantidad inicial en stock.' },
                            unit: { type: Type.STRING, description: 'Unidad de medida.', enum: ['kg', 'g', 'L', 'ml', 'unidad'] },
                            cost: { type: Type.NUMBER, description: 'Costo por unidad.' },
                            alertThreshold: { type: Type.NUMBER, description: 'Nivel de stock bajo para generar una alerta.' }
                        },
                        required: ['name', 'stock', 'unit', 'cost']
                    }
                },
                {
                    name: 'navigateToView',
                    description: 'Navega a una sección o módulo diferente de la aplicación.',
                    parameters: {
                        type: Type.OBJECT,
                        properties: {
                            view: { type: Type.STRING, description: 'La vista a la que se debe navegar.', enum: ['DASHBOARD', 'POS', 'MENU', 'TABLES', 'REPORTS', 'INVENTORY', 'DELIVERY_MANAGER', 'SETTINGS', 'CLIENTS', 'SHOPPING', 'KITCHEN', 'EXPENSES', 'MARKETING', 'LOYALTY', 'QR_MANAGER'] }
                        },
                        required: ['view']
                    }
                },
                {
                    name: 'getQuickStats',
                    description: 'Obtiene una estadística rápida sobre las ventas del día.',
                    parameters: { type: Type.OBJECT, properties: {} }
                }
            ]
        }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                ...chatHistory,
                {
                    role: 'user',
                    parts: [{ text: query }]
                }
            ],
            config: {
                systemInstruction: `Eres "Profe Loco", un asistente de IA para el sistema de restaurante "Restaurante IA Pro". Tu personalidad es enérgica y servicial. Tu objetivo es ayudar al usuario a gestionar el restaurante, ya sea respondiendo preguntas basadas en el manual o ejecutando acciones directamente. Si el usuario pide una acción (ej. "añade un gasto"), usa la función correspondiente. Si falta información para una función, pide la información que falta. Si es una pregunta general, responde basándote en el manual. MANUAL DE ENTRENAMIENTO: --- ${APP_MANUAL_CONTEXT} ---`,
                tools,
            },
        });
        
        const functionCalls = response.functionCalls;

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            return {
                type: 'function_call',
                functionCall: {
                    name: call.name as ProfeLocoAction['name'],
                    args: call.args,
                }
            };
        } else if (response.text) {
            return { type: 'text', text: response.text };
        } else {
             return { type: 'text', text: "No entendí muy bien. ¿Puedes repetirlo de otra forma? 🤔" };
        }
    } catch (error) {
        return { type: 'text', text: handleGeminiError(error, "¡Se me cruzaron los cables! Intenta de nuevo.") };
    }
};

export const getProfeLocoTip = async (
    sales: Sale[],
    users: User[],
    menuItems: MenuItem[],
    currentUser: User,
): Promise<ProfeLocoResponse> => {
    const ai = getAiClient();
    if (!ai) return { tip: "Configura tu API Key en Ajustes para recibir consejos.", topWaiter: "?" };

    const todaySales = sales.filter(sale => new Date(sale.timestamp).toDateString() === new Date().toDateString());
    
    const salesByUser: Record<string, number> = {};
    todaySales.forEach(sale => {
        if (sale.order.userId) {
            salesByUser[sale.order.userId] = (salesByUser[sale.order.userId] || 0) + 1;
        }
    });

    const topWaiterId = Object.keys(salesByUser).length > 0
      ? Object.entries(salesByUser).sort(([,a],[,b]) => b-a)[0][0]
      : null;
    const topWaiterName = topWaiterId ? users.find(u => u.id === topWaiterId)?.name || 'Desconocido' : 'Nadie aún';

    const prompt = `
        Eres "Profe Loco". Basado en el contexto, genera un consejo para el equipo (máximo 40 palabras, en español).
        Contexto:
        - Usuario: ${currentUser.name}
        - Ventas de hoy: ${todaySales.length}
        - Mesero con más ventas: ${topWaiterName}
        El output DEBE ser un JSON: { "tip": "Tu consejo aquí" }.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.OBJECT, properties: { tip: { type: Type.STRING } } }
            }
        });

        const jsonStr = response.text?.trim();
        if (!jsonStr) throw new Error("Empty response");
        const result = JSON.parse(jsonStr);
        return { tip: result.tip, topWaiter: topWaiterName };

    } catch (error) {
        const tip = handleGeminiError(error, "¡Mi cerebro de IA se frió!");
        return { tip, topWaiter: topWaiterName };
    }
};

export const generateMenuDescription = async (dishName: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Requiere API Key.";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Genera una descripción corta, apetitosa y vendedora (max 25 palabras) para un plato de restaurante llamado: "${dishName}".`,
        });
        return response.text || "";
    } catch (e) { return "Error al generar."; }
};

export const generateImageForDish = async (dishName: string, dishDescription: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "";
    // Placeholder logic - Gemini text models don't generate images directly like this without specific tools or imagen models. 
    // We'll assume this feature is intended to be text-to-image or we return a placeholder for now to avoid errors.
    // For a real implementation, you would use an Imagen model here.
    return ""; 
};

export const analyzeDishPricing = async (dishName: string, currentPrice: number, totalCost: number, ingredients: string[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Requiere API Key.";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analiza el precio de "${dishName}". Precio Venta: $${currentPrice}, Costo Ingredientes: $${totalCost}. Ingredientes: ${ingredients.join(', ')}. Dame una recomendación breve sobre si el margen es saludable (ideal 30-35% costo).`,
        });
        return response.text || "";
    } catch (e) { return "Error al analizar."; }
};

export const generateKitchenPrediction = async (sales: any[], inventory: any[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Configura la API Key para ver predicciones.";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Basado en un restaurante de comida rápida, dame un mensaje corto (1 frase) motivando a la cocina a prepararse para la hora pico o felicitándolos.",
        });
        return response.text || "";
    } catch (e) { return "Error de predicción."; }
};

export const parseWhatsAppOrder = async (text: string, menuItems: MenuItem[], orderType: 'delivery' | 'to-go'): Promise<ParsedOrder | null> => {
    const ai = getAiClient();
    if (!ai) return null;
    
    const menuContext = menuItems.map(i => `${i.id}: ${i.name}`).join('\n');
    const prompt = `
        Analiza este mensaje de pedido de WhatsApp: "${text}"
        Tipo de Orden: ${orderType}
        Menú Disponible:
        ${menuContext}
        
        Extrae:
        1. Items del menú (con ID y cantidad). Si el usuario dice "hamburguesa", busca la mejor coincidencia.
        2. Datos del cliente (Nombre, Teléfono, Dirección si es delivery).
        
        Output JSON:
        {
            "customer": { "name": "string", "phone": "string", "address": "string" },
            "items": [ { "menuItemId": "string", "quantity": number, "notes": "string" } ]
        }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const jsonStr = response.text?.trim();
        if (!jsonStr) return null;
        return JSON.parse(jsonStr);
    } catch (e) { return null; }
};

export const generateMarketingMessage = async (segment: string, offer: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "¡Hola! Te extrañamos en Loco Alitas. ¡Vuelve pronto!";

    const prompt = `
        Actúa como un experto en marketing de restaurantes. Redacta un mensaje de WhatsApp para el restaurante "Restaurante IA Pro".
        
        Segmento de Cliente: ${segment} (Ej: "Dormidos" = no vienen hace tiempo, "VIP" = gastan mucho, "Nuevos" = primera visita).
        Oferta/Incentivo: ${offer} (Ej: "Postre gratis", "10% dto").
        
        Objetivo: Que vuelvan a pedir o visitarnos.
        Tono: Divertido, persuasivo, con emojis, corto y directo (formato WhatsApp).
        
        Output: Solo el texto del mensaje.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text?.trim() || "¡Hola! Tenemos alitas deliciosas esperándote. 🍗";
    } catch (e) { return "Error al generar mensaje."; }
};

// Fallback exports for other functions to prevent crashes, updated to use getAiClient
export const generateSalesReport = async (data: any): Promise<string> => { return "Reporte generado por IA (Simulado)" };
export const generateKitchenPerformanceReport = async (data: any): Promise<string> => { return "Reporte de rendimiento (Simulado)" };
export const generateDeliveryMetadata = async (address: string): Promise<any> => { return { normalizedAddress: address, mapsLink: '' } };
export const parseVoiceCommand = async (transcription: string, context: any): Promise<any | null> => { return null };
export const parseKitchenCommand = async (transcript: string, activeOrders: any[]): Promise<any> => { 
    const ai = getAiClient();
    if (!ai) return { action: 'unknown', message: 'Sin API Key' };
    
    const contextStr = activeOrders.map(o => `ID: ${o.id.slice(-4)} - ${o.tableName} (${o.items.join(',')})`).join('\n');
    
    const prompt = `
        Comando de voz en cocina: "${transcript}"
        Órdenes Activas:
        ${contextStr}
        
        Intenciones:
        - "ready": Marcar orden lista. (ej: "mesa 5 lista", "pedido 8a2b listo")
        - "open": Reabrir orden.
        
        Output JSON: { "action": "ready" | "open" | "unknown", "orderId": "full-uuid-if-found", "message": "respuesta corta" }
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    } catch(e) { return { action: 'unknown' }; }
};

export const generateCustomerInsights = async (customerName: string, customerHistory: any[]): Promise<any | null> => { 
    const ai = getAiClient();
    if(!ai) return null;
    const prompt = `Analiza el historial de ${customerName}: ${JSON.stringify(customerHistory)}. Genera tags (ej: "Fan Hamburguesas") y una sugerencia de regalo. JSON: { "tags": string[], "suggestion": string }`;
    try {
        const res = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json"} });
        return JSON.parse(res.text || '{}');
    } catch(e) { return null; }
};

export const suggestLoyaltyReward = async ( purchaseHistory: any[], availableRewards: any[] ): Promise<any | null> => { return null };

export const generateShoppingList = async (inventory: InventoryItem[], sales: Sale[], menu: MenuItem[]): Promise<ShoppingList | null> => {
    const ai = getAiClient();
    if (!ai) return null;

    const invData = inventory.map(i => `${i.name}: Stock ${i.stock} ${i.unit} (Alerta en ${i.alertThreshold})`).join('\n');
    const prompt = `
        Actúa como gerente de compras. Analiza el inventario:
        ${invData}
        
        Genera una lista de compras SUGERIDA para los items con stock bajo o crítico.
        Agrupa por categoría (Carnes, Verduras, Abarrotes, etc).
        
        Output JSON:
        {
            "Carnes": [ { "name": "Carne Molida", "suggestedQuantity": "10 kg", "justification": "Stock crítico (2kg)" } ],
            ...
        }
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    } catch(e) { return null; }
};

export const parseShoppingListCommand = async (transcript: string): Promise<any | null> => { 
    const ai = getAiClient();
    if (!ai) return null;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Comando de voz: "${transcript}". Si el usuario quiere generar la lista de compras, retorna JSON: {"action": "generate_list"}. Si no, {"action": "unknown"}.`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(res.text || '{}');
    } catch (e) { return null; }
};

export const analyzeInventoryImage = async (base64Image: string, mimeType: string, inventoryContext: InventoryItem[]): Promise<Record<string, number> | null> => {
    const ai = getAiClient();
    if (!ai) return null;
    
    const contextList = inventoryContext.map(i => `${i.id}: ${i.name}`).join(', ');
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType, data: base64Image } },
                        { text: `Analiza esta imagen del inventario. Intenta identificar los productos listados: [${contextList}]. Estima la cantidad visible. Retorna SOLO un JSON con los IDs encontrados y la cantidad numérica estimada: { "inv-1": 5, "inv-3": 10 }.` }
                    ]
                }
            ],
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) { return null; }
};

export const parseInventoryVoiceCommand = async (transcription: string, inventoryContext: InventoryItem[]): Promise<ParsedInventoryCommand | null> => {
    const ai = getAiClient();
    if (!ai) return null;
    
    const itemsList = inventoryContext.map(i => i.name).join(', ');
    const prompt = `
        Interpreta comando de voz inventario: "${transcription}"
        Items existentes: ${itemsList}
        
        Intenciones:
        1. "adjust": Cambiar stock (ej: "Papas hay 10 kilos").
        2. "create": Nuevo producto (ej: "Crear Tomates, costo 2000").
        3. "update": Editar dato (ej: "Cambiar costo de alitas a 15000").
        
        Output JSON:
        {
            "intent": "adjust" | "create" | "update" | "unknown",
            "itemName": "string (nombre detectado)",
            "adjustStockValue": number (si aplica),
            "itemData": { "name": string, "cost": number, "unit": string, "stock": number } (si create/update)
        }
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) { return null; }
};

export const parseShoppingItemFromVoice = async (transcript: string): Promise<ShoppingListItem | null> => {
    const ai = getAiClient();
    if (!ai) return null;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Extrae item de compra de: "${transcript}". JSON: { "name": "string", "quantity": "string", "category": "string" }`,
            config: { responseMimeType: "application/json" }
        });
        const data = JSON.parse(res.text || '{}');
        if(data.name) return { ...data, checked: false };
        return null;
    } catch (e) { return null; }
};

export const normalizeAddressAI = async (address: string): Promise<string> => { return address };
export const extractDeliveryCostAI = async (text: string): Promise<any | null> => { 
    const ai = getAiClient();
    if (!ai) return null;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Extrae costo y tiempo de: "${text}". JSON: { "cost": number, "time": "string" }`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(res.text || '{}');
    } catch(e) { return null; }
};

export const analyzeInventoryRisk = async (inventory: any[]): Promise<string> => { 
    const ai = getAiClient();
    if (!ai) return "Configura API Key.";
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analiza riesgo inventario: ${JSON.stringify(inventory.map(i => ({n: i.name, s: i.stock, t: i.alertThreshold})))}. Breve resumen riesgos.`,
        });
        return res.text || "";
    } catch(e) { return "Error."; }
};

export const analyzeMenuEngineering = async (items: MenuEngineeringItem[]): Promise<string[]> => {
    const ai = getAiClient();
    if (!ai) return ["Configura la API Key para ver recomendaciones."];

    // Simplified context to save tokens
    const context = items.map(i => `${i.name}: ${i.classification} (Mg: ${i.marginPercent.toFixed(0)}%, Pop: ${i.popularity.toFixed(0)}%)`).join('\n');

    const prompt = `
        Actúa como consultor de restaurantes. Analiza esta Matriz de Ingeniería de Menú (Boston Matrix):
        ${context}

        Genera 3 recomendaciones estratégicas MUY CONCRETAS y cortas (max 15 palabras c/u).
        Enfócate en qué hacer con los platos 'Estrella', 'Vaca Lechera', 'Incógnita' o 'Perro'.
        
        Output JSON: { "recommendations": ["rec1", "rec2", "rec3"] }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const json = JSON.parse(response.text || '{}');
        return json.recommendations || ["Revisar costos.", "Promocionar platos rentables."];
    } catch (e) { return ["Error al analizar."]; }
};

export const getPublicMenuAdvice = async (userMessage: string, menuItems: MenuItem[]): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "¡Hola! No puedo responder ahora mismo, pero puedes ver el menú completo arriba. 😊";

    const menuContext = menuItems.map(i => `${i.name}: ${formatPrice(i.price)} (${i.description})`).join('\n');
    
    const prompt = `
        Eres un mesero virtual amable y experto del restaurante "Restaurante IA Pro".
        
        MENÚ DISPONIBLE:
        ${menuContext}
        
        PREGUNTA DEL CLIENTE: "${userMessage}"
        
        Tu tarea:
        1. Responder la duda del cliente.
        2. Recomendar platos específicos del menú basándote en su pregunta.
        3. Ser breve (max 40 palabras), simpático y usar emojis.
        
        Si preguntan algo fuera del menú, redirígelos amablemente a nuestros platos.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text?.trim() || "¡Claro! Revisa nuestras hamburguesas y alitas, ¡son deliciosas! 🍔🍗";
    } catch (e) { return "Lo siento, tuve un pequeño problema técnico. ¡Pero nuestras alitas siguen siendo ricas!"; }
};

// FIX: Removed duplicate interface declaration. This type is now correctly imported from '../types'.
