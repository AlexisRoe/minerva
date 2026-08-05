import { Languages } from '@minerva/typescript-lib';
import type { StepTranslation } from '@minerva/ui-lib';

type InitialSteps = Record<Languages, StepTranslation>;

/**
 * The six steps the button walks through while it starts up — reading its
 * environment, waiting for Outlook, filling the office store, signing the user
 * in, fetching settings and handing over to the report page — said in every
 * language Minerva supports. The lists line up index for index, so
 * `mixLanguages` can draw a different locale for each step.
 */
export const InitialLoadingData: InitialSteps = {
  [Languages.Arabic]: {
    rtl: true,
    steps: [
      'جارٍ تحميل البيئة',
      'جارٍ تشغيل Outlook',
      'جارٍ قراءة بريدك',
      'جارٍ تسجيل دخولك بأمان',
      'جارٍ تطبيق إعداداتك',
      'جارٍ تجهيز التقرير',
    ],
  },
  [Languages.Dutch]: {
    rtl: false,
    steps: [
      'Omgeving laden',
      'Outlook wordt gewekt',
      'Uw mailbox lezen',
      'U wordt veilig aangemeld',
      'Uw instellingen toepassen',
      'Rapport wordt voorbereid',
    ],
  },
  [Languages.English]: {
    rtl: false,
    steps: [
      'Loading environment',
      'Waking up Outlook',
      'Reading your mailbox',
      'Signing you in securely',
      'Applying your settings',
      'Getting the report ready',
    ],
  },
  [Languages.French]: {
    rtl: false,
    steps: [
      "Chargement de l'environnement",
      'Réveil d’Outlook',
      'Lecture de votre boîte aux lettres',
      'Connexion sécurisée en cours',
      'Application de vos paramètres',
      'Préparation du rapport',
    ],
  },
  [Languages.German]: {
    rtl: false,
    steps: [
      'Umgebung wird geladen',
      'Outlook wird geweckt',
      'Postfach wird gelesen',
      'Sie werden sicher angemeldet',
      'Einstellungen werden angewendet',
      'Bericht wird vorbereitet',
    ],
  },
  [Languages.Mandarin]: {
    rtl: false,
    steps: [
      '正在加载运行环境',
      '正在唤醒 Outlook',
      '正在读取您的邮箱',
      '正在安全登录',
      '正在应用您的设置',
      '正在准备报告',
    ],
  },
  [Languages.Portuguese]: {
    rtl: false,
    steps: [
      'A carregar o ambiente',
      'A ativar o Outlook',
      'A ler a sua caixa de correio',
      'A iniciar sessão em segurança',
      'A aplicar as suas definições',
      'A preparar o relatório',
    ],
  },
  [Languages.Spanish]: {
    rtl: false,
    steps: [
      'Cargando el entorno',
      'Activando Outlook',
      'Leyendo tu buzón',
      'Iniciando sesión de forma segura',
      'Aplicando tu configuración',
      'Preparando el informe',
    ],
  },
};
