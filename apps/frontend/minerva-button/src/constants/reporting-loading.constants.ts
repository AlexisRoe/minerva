import { Languages } from '@minerva/typescript-lib';
import type { StepTranslation } from '@minerva/ui-lib';

type ReportingSteps = Record<Languages, StepTranslation>;

/**
 * The six steps a report goes through after the user has chosen how to report an
 * email — taking their answers, downloading the raw message through Graph,
 * uploading it to the backend, rendering the notification mails and sending them
 * on — said in every language Minerva supports. The lists line up index for
 * index, so `mixLanguages` can draw a different locale for each step.
 */
export const ReportingLoadingData: ReportingSteps = {
  [Languages.Arabic]: {
    rtl: true,
    steps: [
      'جارٍ جمع إجاباتك',
      'جارٍ تنزيل الرسالة الأصلية',
      'جارٍ رفع البلاغ بأمان',
      'جارٍ تجهيز الإشعارات',
      'جارٍ إبلاغ فريق الأمان',
      'جارٍ إنهاء العملية',
    ],
  },
  [Languages.Dutch]: {
    rtl: false,
    steps: [
      'Uw antwoorden verzamelen',
      'Oorspronkelijke e-mail downloaden',
      'Melding veilig uploaden',
      'Meldingen voorbereiden',
      'Uw securityteam informeren',
      'Afronden',
    ],
  },
  [Languages.English]: {
    rtl: false,
    steps: [
      'Collecting your answers',
      'Downloading the original email',
      'Uploading the report securely',
      'Preparing the notifications',
      'Notifying your security team',
      'Wrapping up',
    ],
  },
  [Languages.French]: {
    rtl: false,
    steps: [
      'Collecte de vos réponses',
      "Téléchargement de l'e-mail d'origine",
      'Envoi sécurisé du signalement',
      'Préparation des notifications',
      'Information de votre équipe de sécurité',
      'Finalisation',
    ],
  },
  [Languages.German]: {
    rtl: false,
    steps: [
      'Ihre Antworten werden gesammelt',
      'Ursprüngliche E-Mail wird heruntergeladen',
      'Meldung wird sicher hochgeladen',
      'Benachrichtigungen werden vorbereitet',
      'Ihr Sicherheitsteam wird informiert',
      'Wird abgeschlossen',
    ],
  },
  [Languages.Mandarin]: {
    rtl: false,
    steps: [
      '正在收集您的回答',
      '正在下载原始邮件',
      '正在安全上传报告',
      '正在准备通知邮件',
      '正在通知您的安全团队',
      '正在完成',
    ],
  },
  [Languages.Portuguese]: {
    rtl: false,
    steps: [
      'A recolher as suas respostas',
      'A transferir o e-mail original',
      'A carregar o relatório em segurança',
      'A preparar as notificações',
      'A informar a sua equipa de segurança',
      'A concluir',
    ],
  },
  [Languages.Spanish]: {
    rtl: false,
    steps: [
      'Recopilando tus respuestas',
      'Descargando el correo original',
      'Subiendo el informe de forma segura',
      'Preparando las notificaciones',
      'Avisando a tu equipo de seguridad',
      'Finalizando',
    ],
  },
};
