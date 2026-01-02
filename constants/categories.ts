// Dilo App - Categorías con Iconos Profesionales (Lucide)
import { Category } from '@/types';

// Icon names correspond to lucide-react-native icons
export const DEFAULT_CATEGORIES: Category[] = [
    // Gastos
    { id: 'food', name: 'Comida', icon: 'utensils', type: 'expense', isVisible: true, color: '#EF4444' },
    { id: 'transport', name: 'Transporte', icon: 'car', type: 'expense', isVisible: true, color: '#EF4444' },
    { id: 'fuel', name: 'Gasolina', icon: 'fuel', type: 'expense', isVisible: true, color: '#EF4444' },
    { id: 'services', name: 'Servicios', icon: 'smartphone', type: 'expense', isVisible: true, color: '#EF4444' },
    { id: 'home', name: 'Alquiler', icon: 'home', type: 'expense', isVisible: true, color: '#EF4444' },
    { id: 'health', name: 'Salud', icon: 'briefcase-medical', type: 'expense', isVisible: true, color: '#EF4444' },
    { id: 'entertainment', name: 'Entretenimiento', icon: 'tv', type: 'expense', isVisible: true, color: '#EF4444' },
    { id: 'clothes', name: 'Ropa', icon: 'user', type: 'expense', isVisible: true, color: '#EF4444' },
    { id: 'education', name: 'Educación', icon: 'graduation-cap', type: 'expense', isVisible: true, color: '#EF4444' },
    { id: 'shopping', name: 'Mercado', icon: 'shopping-cart', type: 'expense', isVisible: true, color: '#EF4444' },

    // Ingresos
    { id: 'salary', name: 'Salario', icon: 'briefcase', type: 'income', isVisible: true, color: '#10B981' },
    { id: 'sales', name: 'Venta', icon: 'store', type: 'income', isVisible: true, color: '#10B981' },
    { id: 'freelance', name: 'Freelance', icon: 'laptop', type: 'income', isVisible: true, color: '#10B981' },
    { id: 'transfer-in', name: 'Transferencia', icon: 'arrow-left-right', type: 'income', isVisible: true, color: '#10B981' },
    { id: 'gift', name: 'Regalo', icon: 'gift', type: 'income', isVisible: true, color: '#10B981' },
    { id: 'investment', name: 'Inversión', icon: 'trending-up', type: 'income', isVisible: true, color: '#10B981' },
    { id: 'remittance', name: 'Remesa', icon: 'file-text', type: 'income', isVisible: true, color: '#10B981' },

    // Ambos
    { id: 'other', name: 'Otros', icon: 'circle', type: 'both', isVisible: true, color: '#64748B' },
];

// Map icon names to Lucide components (used in CategoryIcon component)
export const LUCIDE_ICON_MAP: Record<string, string> = {
    'utensils': 'Utensils',
    'car': 'Car',
    'fuel': 'Fuel',
    'smartphone': 'Smartphone',
    'home': 'Home',
    'briefcase-medical': 'BriefcaseMedical',
    'tv': 'Tv',
    'user': 'User',
    'graduation-cap': 'GraduationCap',
    'shopping-cart': 'ShoppingCart',
    'briefcase': 'Briefcase',
    'store': 'Store',
    'laptop': 'Laptop',
    'arrow-left-right': 'ArrowLeftRight',
    'gift': 'Gift',
    'trending-up': 'TrendingUp',
    'file-text': 'FileText',
    'circle': 'Circle',
    'plus': 'Plus',
    'wallet': 'Wallet',
    'credit-card': 'CreditCard',
    'heart': 'Heart',
    'star': 'Star',
    'tag': 'Tag',
    'percent': 'Percent',
    'building': 'Building',
    'plane': 'Plane',
    'music': 'Music',
    'book': 'Book',
    'coffee': 'Coffee',
    'scissors': 'Scissors',
};

/**
 * Encuentra una categoría por nombre (case-insensitive)
 */
export function findCategoryByName(name: string): Category | undefined {
    const normalized = name.toLowerCase().trim();
    return DEFAULT_CATEGORIES.find(
        (cat) => cat.name.toLowerCase() === normalized || cat.id === normalized
    );
}

/**
 * Obtiene categorías por tipo
 */
export function getCategoriesByType(type: 'income' | 'expense' | 'both'): Category[] {
    return DEFAULT_CATEGORIES.filter(
        (cat) => cat.type === type || cat.type === 'both'
    );
}

/**
 * Mapeo de palabras clave a categorías (para el parser de voz)
 * Expandido con vocabulario venezolano/latinoamericano
 */
export const CATEGORY_KEYWORDS: Record<string, string> = {
    // ============ GASTOS ============

    // Comida y Bebidas
    'comida': 'food',
    'almuerzo': 'food',
    'cena': 'food',
    'desayuno': 'food',
    'merienda': 'food',
    'restaurante': 'food',
    'cafe': 'food',
    'café': 'food',
    'cafecito': 'food',
    'cerveza': 'food',
    'birra': 'food',
    'trago': 'food',
    'refresco': 'food',
    'jugo': 'food',
    'empanada': 'food',
    'arepa': 'food',
    'pizza': 'food',
    'hamburguesa': 'food',
    'pollo': 'food',
    'carne': 'food',
    'pescado': 'food',
    'sushi': 'food',
    'helado': 'food',
    'dulce': 'food',
    'snack': 'food',
    'pasapalos': 'food',
    'delivery': 'food',
    'pedido': 'food',
    'rappi': 'food',
    'yummy': 'food',

    // Mercado/Compras
    'mercado': 'shopping',
    'supermercado': 'shopping',
    'compras': 'shopping',
    'automercado': 'shopping',
    'bodega': 'shopping',
    'abasto': 'shopping',
    'farmacia': 'health',

    // Transporte
    'transporte': 'transport',
    'uber': 'transport',
    'taxi': 'transport',
    'bus': 'transport',
    'buseta': 'transport',
    'metro': 'transport',
    'pasaje': 'transport',
    'boleto': 'transport',
    'camioneta': 'transport',
    'moto': 'transport',
    'mototaxi': 'transport',
    'yango': 'transport',
    'didi': 'transport',
    'viaje': 'transport',
    'estacionamiento': 'transport',
    'peaje': 'transport',

    // Gasolina
    'gasolina': 'fuel',
    'combustible': 'fuel',
    'gasoil': 'fuel',
    'diesel': 'fuel',
    'tanque': 'fuel',
    'llenar': 'fuel',

    // Servicios
    'luz': 'services',
    'agua': 'services',
    'internet': 'services',
    'telefono': 'services',
    'teléfono': 'services',
    'celular': 'services',
    'netflix': 'services',
    'spotify': 'services',
    'youtube': 'services',
    'disney': 'services',
    'hbo': 'services',
    'prime': 'services',
    'amazon': 'services',
    'cable': 'services',
    'directv': 'services',
    'simple': 'services',
    'movistar': 'services',
    'digitel': 'services',
    'cantv': 'services',

    // Salud
    'medicina': 'health',
    'medicamento': 'health',
    'pastilla': 'health',
    'doctor': 'health',
    'medico': 'health',
    'médico': 'health',
    'consulta': 'health',
    'clinica': 'health',
    'clínica': 'health',
    'hospital': 'health',
    'laboratorio': 'health',
    'examen': 'health',
    'dentista': 'health',
    'odontologo': 'health',

    // Ropa
    'ropa': 'clothes',
    'zapatos': 'clothes',
    'tenis': 'clothes',
    'camisa': 'clothes',
    'pantalon': 'clothes',
    'pantalón': 'clothes',
    'jean': 'clothes',
    'vestido': 'clothes',
    'chaqueta': 'clothes',
    'franela': 'clothes',
    'short': 'clothes',
    'bermuda': 'clothes',
    'calzado': 'clothes',
    'sandalia': 'clothes',
    'gorra': 'clothes',
    'sombrero': 'clothes',

    // Entretenimiento
    'cine': 'entertainment',
    'pelicula': 'entertainment',
    'película': 'entertainment',
    'teatro': 'entertainment',
    'concierto': 'entertainment',
    'fiesta': 'entertainment',
    'disco': 'entertainment',
    'bar': 'entertainment',
    'club': 'entertainment',
    'videojuego': 'entertainment',
    'juego': 'entertainment',
    'playstation': 'entertainment',
    'xbox': 'entertainment',

    // Educación
    'colegio': 'education',
    'escuela': 'education',
    'universidad': 'education',
    'curso': 'education',
    'libro': 'education',
    'cuaderno': 'education',
    'matricula': 'education',
    'matrícula': 'education',
    'inscripcion': 'education',
    'inscripción': 'education',

    // Hogar/Alquiler
    'alquiler': 'home',
    'renta': 'home',
    'condominio': 'home',
    'mantenimiento': 'home',

    // ============ INGRESOS ============

    // Salario
    'salario': 'salary',
    'sueldo': 'salary',
    'nomina': 'salary',
    'nómina': 'salary',
    'quincena': 'salary',
    'pago': 'salary',

    // Ventas
    'venta': 'sales',
    'ventas': 'sales',
    'vendi': 'sales',
    'vendí': 'sales',
    'negocio': 'sales',
    'cliente': 'sales',

    // Freelance
    'trabajo': 'freelance',
    'proyecto': 'freelance',
    'freelance': 'freelance',
    'servicio': 'freelance',
    'comision': 'freelance',
    'comisión': 'freelance',

    // Transferencias/Remesas
    'transferencia': 'transfer-in',
    'deposito': 'transfer-in',
    'depósito': 'transfer-in',
    'remesa': 'remittance',
    'envio': 'remittance',
    'envío': 'remittance',
    'giro': 'remittance',
    'western': 'remittance',
    'zelle': 'transfer-in',
    'paypal': 'transfer-in',

    // Regalo
    'regalo': 'gift',
    'propina': 'gift',
    'bono': 'gift',
    'aguinaldo': 'gift',

    // Inversiones
    'inversion': 'investment',
    'inversión': 'investment',
    'dividendo': 'investment',
    'interes': 'investment',
    'interés': 'investment',
    'cripto': 'investment',
    'bitcoin': 'investment',
    'usdt': 'investment',
};

