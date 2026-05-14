import type { DeviceArea, DeviceId } from '../types/device';

export type Language = 'he' | 'en' | 'fr';

export const languageLabels: Record<Language, string> = {
  he: 'עברית',
  en: 'English',
  fr: 'Français'
};

export const languageDirections: Record<Language, 'rtl' | 'ltr'> = {
  he: 'rtl',
  en: 'ltr',
  fr: 'ltr'
};

export const translations = {
  he: {
    nav: {
      home: 'בית',
      lighting: 'תאורה',
      scenes: 'תרחישים',
      shabbat: 'מצב שבת',
      guest: 'מידע לאורחים'
    },
    common: {
      connected: 'מחובר ומוכן לשימוש מקומי',
      offline: 'האפליקציה זמינה גם לא מקוון. שליטה אמיתית תדרוש רשת מקומית.',
      active: 'פעיל',
      off: 'כבוי',
      included: 'כלול',
      inactive: 'לא פעיל',
      loading: 'טוען את הווילה...',
      addTime: 'הוסף שעה',
      clearTime: 'בטל שעה'
    },
    home: {
      title: 'Royal Water Villa',
      subtitle: 'שליטה מקומית, רגועה ומוכנה לאורחי הווילה',
      eyebrow: 'טאבלט שליטה פרטי',
      headline: 'ערב שקט, תאורה מדויקת, הכל במקום אחד.',
      lightingButton: 'שליטה בתאורה',
      turnOffAll: 'כבה הכל',
      shabbatTitle: 'מצב שבת',
      shabbatDescription: 'הגדרה פשוטה לכל חדר, עם סיכום ברור לפני הפעלה.',
      shabbatActive: 'מצב שבת פעיל',
      shabbatActiveNote: 'הטאבלט יבצע את הפעולות בזמן שהאפליקציה פתוחה.',
      activeDevices: 'מכשירים דולקים עכשיו'
    },
    lighting: {
      title: 'תאורה ומכשירים',
      subtitle: 'כפתורים גדולים לשליטה מיידית',
      turnOn: 'הדלק',
      turnOff: 'כבה'
    },
    scenes: {
      title: 'תרחישים',
      subtitle: 'פעולות מוכנות מראש לאווירה הנכונה',
      poolEvening: 'ערב בבריכה',
      calmHosting: 'אירוח רגוע',
      quietNight: 'לילה שקט',
      description: 'מגע אחד, בלי תפריטים עמוקים.'
    },
    shabbat: {
      title: 'מצב שבת',
      subtitle: 'הגדרה ברורה לאורחים עם סיכום פשוט לכל אזור',
      appToggleTitle: 'הפעלת מצב שבת באפליקציה',
      storedLocally: 'ההגדרות נשמרות מקומית בטאבלט.',
      runnerActive: 'שעון שבת פעיל במכשיר זה',
      runnerOff: 'שעון שבת כבוי',
      keepTabletOn: 'הטאבלט חייב להישאר דולק ומחובר ל-WiFi.',
      enableMode: 'הפעל מצב שבת',
      deviceEnabled: 'פעיל לשבת',
      beforeShabbat: 'הדלק לפני כניסת שבת',
      nightOff: 'כיבוי בלילה',
      morningOn: 'הדלקת בוקר',
      morningOff: 'כיבוי בוקר',
      motzeiOff: 'כיבוי מוצאי שבת',
      enableDevice: 'הפעל לשבת',
      summaryInactive: 'לא פעיל לשבת',
      summaryBeforeOn: 'נדלק לפני שבת',
      summaryBeforeOff: 'לא נדלק לפני שבת',
      summaryNightOff: 'כיבוי ב-',
      summaryNoNightOff: 'ללא כיבוי לילה',
      summaryMorningOn: 'נדלק בבוקר ',
      summaryMorningOff: 'נכבה בבוקר ',
      summaryMotzeiOff: 'כיבוי במוצ"ש '
    },
    guest: {
      title: 'מידע לאורחים',
      subtitle: 'פרטים חשובים לשהייה רגועה',
      wifiTitle: 'WiFi',
      wifiText: 'שם הרשת והסיסמה יתווספו בטאבלט המקומי.',
      poolTitle: 'בריכה',
      poolText: 'יש להשאיר ילדים בהשגחת מבוגר בלבד.',
      checkoutTitle: 'יציאה',
      checkoutText: 'כיבוי כללי זמין במסך הבית לפני עזיבה.',
      supportTitle: 'תמיכה',
      supportText: 'לכל תקלה, פנו לצוות האירוח במספר שיוגדר במקום.'
    },
    areas: {
      living: 'סלון',
      outdoor: 'חוץ / פרגולה',
      pool: 'בריכה',
      bathroom: 'שירותים / מקלחת',
      bedroom: 'חדר שינה'
    } satisfies Record<DeviceArea, string>,
    devices: {
      wallLight: 'תאורת חומה',
      pergolaLight: 'תאורת פרגולה',
      livingRoomLedWall: 'תאורת קיר LED בסלון',
      livingRoomCeilingSpots: 'ספוטים תקרה סלון',
      barLight: 'תאורת בר חיצוני',
      poolLight: 'תאורת בריכה',
      rearPathLight: 'תאורת שביל אחורי',
      outdoorWallLight: 'תאורת קיר חוץ',
      bathroomLight: 'תאורת אמבטיה',
      ceilingFan: 'מאוורר תקרה',
      ceilingFanLight: 'תאורת מאוורר / חדר שינה',
      bathroomHeater: 'תנור חימום מקלחת'
    } satisfies Record<DeviceId, string>
  },
  en: {
    nav: {
      home: 'Home',
      lighting: 'Lighting',
      scenes: 'Scenes',
      shabbat: 'Shabbat Mode',
      guest: 'Guest Info'
    },
    common: {
      connected: 'Connected and ready for local use',
      offline: 'The app still loads offline. Real control requires the local network.',
      active: 'Active',
      off: 'Off',
      included: 'Included',
      inactive: 'Inactive',
      loading: 'Loading the villa...',
      addTime: 'Add time',
      clearTime: 'Clear time'
    },
    home: {
      title: 'Royal Water Villa',
      subtitle: 'Calm local control for villa guests',
      eyebrow: 'Private control tablet',
      headline: 'Quiet evening, precise lighting, everything in one place.',
      lightingButton: 'Control lighting',
      turnOffAll: 'Turn off all',
      shabbatTitle: 'Shabbat Mode',
      shabbatDescription: 'Simple room-by-room setup with a clear summary before activation.',
      shabbatActive: 'Shabbat Mode active',
      shabbatActiveNote: 'The tablet will run actions while the app is open.',
      activeDevices: 'Devices currently on'
    },
    lighting: {
      title: 'Lighting And Devices',
      subtitle: 'Large controls for immediate use',
      turnOn: 'Turn on',
      turnOff: 'Turn off'
    },
    scenes: {
      title: 'Scenes',
      subtitle: 'Ready-made actions for the right atmosphere',
      poolEvening: 'Pool Evening',
      calmHosting: 'Calm Hosting',
      quietNight: 'Quiet Night',
      description: 'One touch, no deep menus.'
    },
    shabbat: {
      title: 'Shabbat Mode',
      subtitle: 'Clear guest setup with a simple summary for every area',
      appToggleTitle: 'Enable Shabbat Mode in the app',
      storedLocally: 'Settings are saved locally on this tablet.',
      runnerActive: 'Shabbat timer is active on this device',
      runnerOff: 'Shabbat timer is off',
      keepTabletOn: 'The tablet must stay on and connected to WiFi.',
      enableMode: 'Enable Shabbat Mode',
      deviceEnabled: 'Enabled for Shabbat',
      beforeShabbat: 'Turn on before Shabbat',
      nightOff: 'Night off time',
      morningOn: 'Morning on time',
      morningOff: 'Morning off time',
      motzeiOff: 'Motzei Shabbat off time',
      enableDevice: 'Enable for Shabbat',
      summaryInactive: 'Not active for Shabbat',
      summaryBeforeOn: 'Turns on before Shabbat',
      summaryBeforeOff: 'Does not turn on before Shabbat',
      summaryNightOff: 'Off at ',
      summaryNoNightOff: 'No night off',
      summaryMorningOn: 'On in the morning at ',
      summaryMorningOff: 'Off in the morning at ',
      summaryMotzeiOff: 'Off after Shabbat at '
    },
    guest: {
      title: 'Guest Info',
      subtitle: 'Helpful details for a relaxed stay',
      wifiTitle: 'WiFi',
      wifiText: 'The network name and password will be added on the local tablet.',
      poolTitle: 'Pool',
      poolText: 'Children must remain under adult supervision.',
      checkoutTitle: 'Checkout',
      checkoutText: 'The main turn-off control is available on the home screen before leaving.',
      supportTitle: 'Support',
      supportText: 'For any issue, contact the hosting team using the number provided on site.'
    },
    areas: {
      living: 'Living Room',
      outdoor: 'Outdoor / Pergola',
      pool: 'Pool',
      bathroom: 'Bathroom',
      bedroom: 'Bedroom'
    } satisfies Record<DeviceArea, string>,
    devices: {
      wallLight: 'Wall Light',
      pergolaLight: 'Pergola Light',
      livingRoomLedWall: 'Living Room LED Wall Light',
      livingRoomCeilingSpots: 'Living Room Ceiling Spots',
      barLight: 'Outdoor Bar Light',
      poolLight: 'Pool Light',
      rearPathLight: 'Rear Path Light',
      outdoorWallLight: 'Outdoor Wall Light',
      bathroomLight: 'Bathroom Light',
      ceilingFan: 'Ceiling Fan',
      ceilingFanLight: 'Fan / Bedroom Light',
      bathroomHeater: 'Bathroom Heater'
    } satisfies Record<DeviceId, string>
  },
  fr: {
    nav: {
      home: 'Accueil',
      lighting: 'Éclairage',
      scenes: 'Scènes',
      shabbat: 'Mode Chabbat',
      guest: 'Infos invités'
    },
    common: {
      connected: 'Connecté et prêt pour un usage local',
      offline: "L'application reste disponible hors ligne. Le contrôle réel nécessite le réseau local.",
      active: 'Actif',
      off: 'Désactivé',
      included: 'Inclus',
      inactive: 'Inactif',
      loading: 'Chargement de la villa...',
      addTime: 'Ajouter',
      clearTime: 'Retirer'
    },
    home: {
      title: 'Royal Water Villa',
      subtitle: 'Contrôle local et serein pour les invités de la villa',
      eyebrow: 'Tablette de contrôle privée',
      headline: 'Soirée calme, éclairage précis, tout au même endroit.',
      lightingButton: "Contrôler l'éclairage",
      turnOffAll: 'Tout éteindre',
      shabbatTitle: 'Mode Chabbat',
      shabbatDescription: 'Réglage simple par pièce, avec un résumé clair avant activation.',
      shabbatActive: 'Mode Chabbat actif',
      shabbatActiveNote: "La tablette exécutera les actions tant que l'application reste ouverte.",
      activeDevices: 'Appareils allumés'
    },
    lighting: {
      title: 'Éclairage Et Appareils',
      subtitle: 'Grandes commandes pour une utilisation immédiate',
      turnOn: 'Allumer',
      turnOff: 'Éteindre'
    },
    scenes: {
      title: 'Scènes',
      subtitle: "Actions prêtes pour créer l'ambiance souhaitée",
      poolEvening: 'Soirée Piscine',
      calmHosting: 'Accueil Calme',
      quietNight: 'Nuit Paisible',
      description: 'Un seul geste, sans menus profonds.'
    },
    shabbat: {
      title: 'Mode Chabbat',
      subtitle: 'Réglage clair pour les invités, avec un résumé simple par zone',
      appToggleTitle: "Activation du mode Chabbat dans l'application",
      storedLocally: 'Les réglages sont enregistrés localement sur cette tablette.',
      runnerActive: 'Minuterie Chabbat active sur cet appareil',
      runnerOff: 'Minuterie Chabbat désactivée',
      keepTabletOn: 'La tablette doit rester allumée et connectée au WiFi.',
      enableMode: 'Activer le mode Chabbat',
      deviceEnabled: 'Activé pour Chabbat',
      beforeShabbat: 'Allumer avant Chabbat',
      nightOff: 'Extinction de nuit',
      morningOn: 'Allumage du matin',
      morningOff: 'Extinction du matin',
      motzeiOff: 'Extinction après Chabbat',
      enableDevice: 'Activer pour Chabbat',
      summaryInactive: 'Non actif pour Chabbat',
      summaryBeforeOn: 'S’allume avant Chabbat',
      summaryBeforeOff: 'Ne s’allume pas avant Chabbat',
      summaryNightOff: 'Extinction à ',
      summaryNoNightOff: 'Pas d’extinction de nuit',
      summaryMorningOn: 'Allumage le matin à ',
      summaryMorningOff: 'Extinction le matin à ',
      summaryMotzeiOff: 'Extinction après Chabbat à '
    },
    guest: {
      title: 'Infos Invités',
      subtitle: 'Informations utiles pour un séjour tranquille',
      wifiTitle: 'WiFi',
      wifiText: 'Le nom du réseau et le mot de passe seront ajoutés sur la tablette locale.',
      poolTitle: 'Piscine',
      poolText: 'Les enfants doivent rester sous la surveillance d’un adulte.',
      checkoutTitle: 'Départ',
      checkoutText: "La commande d'extinction générale est disponible sur l'écran d'accueil avant de partir.",
      supportTitle: 'Assistance',
      supportText: "En cas de problème, contactez l'équipe d'accueil au numéro indiqué sur place."
    },
    areas: {
      living: 'Salon',
      outdoor: 'Extérieur / Pergola',
      pool: 'Piscine',
      bathroom: 'Salle de bain',
      bedroom: 'Chambre'
    } satisfies Record<DeviceArea, string>,
    devices: {
      wallLight: 'Éclairage du mur extérieur',
      pergolaLight: 'Éclairage de la pergola',
      livingRoomLedWall: 'Mur LED du salon',
      livingRoomCeilingSpots: 'Spots du plafond du salon',
      barLight: 'Éclairage du bar extérieur',
      poolLight: 'Éclairage de la piscine',
      rearPathLight: 'Éclairage du chemin arrière',
      outdoorWallLight: 'Éclairage mural extérieur',
      bathroomLight: 'Éclairage de la salle de bain',
      ceilingFan: 'Ventilateur de plafond',
      ceilingFanLight: 'Lumière du ventilateur / chambre',
      bathroomHeater: 'Chauffage de salle de bain'
    } satisfies Record<DeviceId, string>
  }
} as const;

export type Translation = (typeof translations)[Language];
