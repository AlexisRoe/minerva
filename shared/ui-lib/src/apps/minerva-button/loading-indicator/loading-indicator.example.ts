import type { StepTranslations } from './loading-indicator.util';

/**
 * The same seven steps of an add-in starting up, said seven ways. It is a story
 * fixture — the indicator itself ships with nothing but `loading ...`, and every
 * word it shows comes from whoever puts it on a page.
 */
export const STEP_TRANSLATIONS: StepTranslations = {
  en: {
    rtl: false,
    steps: [
      'Loading Office.js runtime',
      'Initializing add-in',
      'Authenticating your account',
      'Connecting to Outlook',
      'Syncing mailbox data',
      'Applying your settings',
      'Almost ready',
    ],
  },
  de: {
    rtl: false,
    steps: [
      'Office.js-Laufzeit wird geladen',
      'Add-In wird initialisiert',
      'Konto wird authentifiziert',
      'Verbindung zu Outlook wird hergestellt',
      'Postfachdaten werden synchronisiert',
      'Einstellungen werden angewendet',
      'Fast fertig',
    ],
  },
  fr: {
    rtl: false,
    steps: [
      'Chargement du runtime Office.js',
      'Initialisation du complément',
      'Authentification de votre compte',
      'Connexion à Outlook',
      'Synchronisation des données de la boîte aux lettres',
      'Application de vos paramètres',
      'Presque prêt',
    ],
  },
  es: {
    rtl: false,
    steps: [
      'Cargando el runtime de Office.js',
      'Inicializando el complemento',
      'Autenticando tu cuenta',
      'Conectando con Outlook',
      'Sincronizando los datos del buzón',
      'Aplicando tu configuración',
      'Casi listo',
    ],
  },
  zh: {
    rtl: false,
    steps: [
      '正在加载 Office.js 运行时',
      '正在初始化外接程序',
      '正在验证您的账户',
      '正在连接到 Outlook',
      '正在同步邮箱数据',
      '正在应用您的设置',
      '即将完成',
    ],
  },
  ar: {
    rtl: true,
    steps: [
      'جارٍ تحميل بيئة تشغيل Office.js',
      'جارٍ تهيئة الوظيفة الإضافية',
      'جارٍ التحقق من حسابك',
      'جارٍ الاتصال بـ Outlook',
      'جارٍ مزامنة بيانات البريد',
      'جارٍ تطبيق إعداداتك',
      'اقتربنا من الانتهاء',
    ],
  },
  ru: {
    rtl: false,
    steps: [
      'Загрузка среды выполнения Office.js',
      'Инициализация надстройки',
      'Аутентификация вашей учётной записи',
      'Подключение к Outlook',
      'Синхронизация данных почтового ящика',
      'Применение ваших настроек',
      'Почти готово',
    ],
  },
};
