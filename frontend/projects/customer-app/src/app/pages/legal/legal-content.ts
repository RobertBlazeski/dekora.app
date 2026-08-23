import { Locale } from '../../i18n/locale';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDoc {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export const TERMS_CONTENT: Record<Locale, LegalDoc> = {
  en: {
    title: 'Terms of Service',
    intro:
      'These terms cover how Dekora works: browsing, ordering, delivery, payment and your account. By placing an order — as a guest or with an account — you agree to them.',
    sections: [
      {
        heading: '1. Who we are',
        paragraphs: [
          'Dekora is a handmade gift shop based in Tetovo, North Macedonia, making satin bouquets, balloon boxes, baskets and event decor to order.',
        ],
      },
      {
        heading: '2. Placing an order',
        paragraphs: [
          'You can order as a guest or by creating an account. An account lets you track past orders and earn loyalty points; guest orders skip both.',
          "Placing an order isn't final until we confirm it by phone — we call every order before we start preparing it, to check the details and delivery time are right.",
        ],
      },
      {
        heading: '3. Pricing and payment',
        paragraphs: [
          'All prices are shown in Macedonian denars (ден) and include any delivery fee shown at checkout.',
          "Payment is collected at delivery, in cash, unless we've agreed on something else with you directly. Card payment online is planned but not available yet.",
        ],
      },
      {
        heading: '4. Delivery',
        paragraphs: [
          'A flat delivery fee applies at checkout. Delivery normally takes up to 3 business days from confirmation.',
          "It's your responsibility to give us an accurate delivery address and a phone number we can reach you on — we can't guarantee delivery if either is wrong.",
        ],
      },
      {
        heading: '5. Changes and cancellations',
        paragraphs: [
          "You can change or cancel your order free of charge any time before we start preparing it — just call or message us. Once preparation has started, see our Refund Policy: most handmade orders can no longer be cancelled at that point.",
        ],
      },
      {
        heading: '6. Loyalty points',
        paragraphs: [
          "Customers with an account earn points on completed orders, redeemable for a discount once you reach the minimum balance shown at checkout. Points have no cash value outside of redemption and aren't earned on guest orders.",
        ],
      },
      {
        heading: '7. Product accuracy',
        paragraphs: [
          "Every item is handmade, so small variations from the photos (exact satin shade, balloon arrangement, wrapping) are normal and not a defect on their own.",
        ],
      },
      {
        heading: '8. Your account',
        paragraphs: [
          "Keep your password to yourself and let us know right away if you think someone else has access to your account. You're responsible for orders placed while logged into your account.",
        ],
      },
      {
        heading: '9. Liability',
        paragraphs: [
          'We aim to deliver exactly what was ordered, on time and in good condition. Where something goes wrong on our side, our Refund Policy explains how we make it right — our liability is limited to the value of the order itself.',
        ],
      },
      {
        heading: '10. Changes to these terms',
        paragraphs: ['We may update these terms occasionally; the current version always applies to new orders.'],
      },
      {
        heading: '11. Governing law',
        paragraphs: ['These terms are governed by the laws of the Republic of North Macedonia.'],
      },
      {
        heading: '12. Contact',
        paragraphs: [`Questions about these terms? Reach us at {{email}} or {{phone}}.`],
      },
    ],
  },
  mk: {
    title: 'Услови на користење',
    intro:
      'Овие услови објаснуваат како функционира Dekora: прегледување, нарачување, достава, плаќање и вашиот профил. Со нарачување — како гостин или со профил — се согласувате со нив.',
    sections: [
      {
        heading: '1. Кои сме ние',
        paragraphs: [
          'Dekora е продавница за рачно изработени подароци од Тетово, Северна Македонија, каде по нарачка се изработуваат сатенски букети, кутии со балони, кошнички и декор за настани.',
        ],
      },
      {
        heading: '2. Нарачување',
        paragraphs: [
          'Можете да нарачате како гостин или со отворен профил. Профилот овозможува следење на претходни нарачки и собирање поени; нарачките како гостин ги немаат овие две можности.',
          'Нарачката не е конечна се додека не ја потврдиме телефонски — секоја нарачка ја повикуваме пред да почнеме со подготовка, за да ги провериме деталите и времето на достава.',
        ],
      },
      {
        heading: '3. Цени и плаќање',
        paragraphs: [
          'Сите цени се прикажани во македонски денари (ден) и вклучуваат каква било давачка за достава прикажана при нарачка.',
          'Плаќањето се врши при достава, во готово, освен ако не сме се договориле поинаку директно со вас. Онлајн плаќање со картичка е планирано, но сè уште не е достапно.',
        ],
      },
      {
        heading: '4. Достава',
        paragraphs: [
          'При нарачка се наплатува фиксна давачка за достава. Доставата обично трае до 3 работни дена од потврдата.',
          'Ваша одговорност е да наведете точна адреса за достава и телефонски број на кој можеме да ве контактираме — не можеме да гарантираме достава ако некој од овие податоци е погрешен.',
        ],
      },
      {
        heading: '5. Промени и откажувања',
        paragraphs: [
          'Можете бесплатно да ја промените или откажете нарачката во секое време пред да започнеме со подготовка — само јавете се или пишете ни. Откако ќе започне подготовката, погледнете ја нашата Политика за рефундација: повеќето рачно изработени нарачки повеќе не можат да се откажат во тој момент.',
        ],
      },
      {
        heading: '6. Поени за лојалност',
        paragraphs: [
          'Клиентите со профил собираат поени за завршени нарачки, кои може да се искористат за попуст откако ќе го достигнете минималното салдо прикажано при нарачка. Поените немаат парична вредност надвор од искористувањето и не се собираат при нарачки како гостин.',
        ],
      },
      {
        heading: '7. Точност на производите',
        paragraphs: [
          'Секој производ е рачно изработен, па мали отстапувања од фотографиите (точна нијанса на сатенот, распоред на балони, пакување) се нормални и сами по себе не претставуваат дефект.',
        ],
      },
      {
        heading: '8. Вашиот профил',
        paragraphs: [
          'Чувајте ја вашата лозинка за себе и веднаш известете нè доколку мислите дека некој друг има пристап до вашиот профил. Одговорни сте за нарачките направени додека сте најавени на вашиот профил.',
        ],
      },
      {
        heading: '9. Одговорност',
        paragraphs: [
          'Се стремиме да испорачаме точно она што е нарачано, навреме и во добра состојба. Доколку нешто тргне наопаку од наша страна, нашата Политика за рефундација објаснува како тоа го решаваме — нашата одговорност е ограничена на вредноста на самата нарачка.',
        ],
      },
      {
        heading: '10. Промени на овие услови',
        paragraphs: ['Повремено можеме да ги ажурираме овие услови; тековната верзија секогаш важи за нови нарачки.'],
      },
      {
        heading: '11. Важечко право',
        paragraphs: ['Овие услови се уредени според законите на Република Северна Македонија.'],
      },
      {
        heading: '12. Контакт',
        paragraphs: [`Прашања за овие услови? Контактирајте нè на {{email}} или {{phone}}.`],
      },
    ],
  },
  sq: {
    title: 'Kushtet e Shërbimit',
    intro:
      'Këto kushte shpjegojnë si funksionon Dekora: shfletimi, porositja, dërgesa, pagesa dhe llogaria juaj. Duke bërë një porosi — si vizitor ose me llogari — ju pajtoheni me to.',
    sections: [
      {
        heading: '1. Kush jemi ne',
        paragraphs: [
          'Dekora është një dyqan dhurash të bëra me dorë me bazë në Tetovë, Maqedoninë e Veriut, që përgatit sipas porosisë buqeta satini, kuti me balona, shporta dhe dekor për evente.',
        ],
      },
      {
        heading: '2. Bërja e një porosie',
        paragraphs: [
          'Mund të porositni si vizitor ose duke krijuar një llogari. Llogaria ju lejon të ndiqni porositë e mëparshme dhe të fitoni pikë besnikërie; porositë si vizitor nuk i kanë këto dy mundësi.',
          "Porosia nuk është përfundimtare derisa ta konfirmojmë me telefon — çdo porosi e telefonojmë përpara se të fillojmë përgatitjen, për të verifikuar detajet dhe kohën e dërgesës.",
        ],
      },
      {
        heading: '3. Çmimet dhe pagesa',
        paragraphs: [
          'Të gjitha çmimet shfaqen në denarë maqedonas (ден) dhe përfshijnë çdo tarifë dërgese të shfaqur gjatë porosisë.',
          'Pagesa merret në momentin e dërgesës, në para të gatshme, përveç rasteve kur jemi marrë vesh ndryshe drejtpërdrejt me ju. Pagesa online me kartë është e planifikuar, por ende nuk është e disponueshme.',
        ],
      },
      {
        heading: '4. Dërgesa',
        paragraphs: [
          'Gjatë porosisë aplikohet një tarifë fikse dërgese. Dërgesa zakonisht zgjat deri në 3 ditë pune nga konfirmimi.',
          'Është përgjegjësia juaj të na jepni një adresë dërgese të saktë dhe një numër telefoni ku mund t’ju kontaktojmë — nuk mund të garantojmë dërgesën nëse njëra prej tyre është e gabuar.',
        ],
      },
      {
        heading: '5. Ndryshimet dhe anulimet',
        paragraphs: [
          'Mund ta ndryshoni ose anuloni porosinë pa pagesë në çdo kohë përpara se të fillojmë përgatitjen — thjesht na telefononi ose na shkruani. Pasi të ketë filluar përgatitja, shihni Politikën tonë të Rimbursimit: shumica e porosive të bëra me dorë nuk mund të anulohen më në atë pikë.',
        ],
      },
      {
        heading: '6. Pikët e besnikërisë',
        paragraphs: [
          'Klientët me llogari fitojnë pikë për porositë e përfunduara, të shkëmbyeshme për zbritje pasi të arrini bilancin minimal të shfaqur gjatë porosisë. Pikët nuk kanë vlerë monetare jashtë shkëmbimit dhe nuk fitohen në porositë si vizitor.',
        ],
      },
      {
        heading: '7. Saktësia e produkteve',
        paragraphs: [
          'Çdo artikull bëhet me dorë, kështu që dallime të vogla nga fotografitë (nuanca e saktë e satenit, rregullimi i balonave, paketimi) janë normale dhe nuk përbëjnë vetvetiu defekt.',
        ],
      },
      {
        heading: '8. Llogaria juaj',
        paragraphs: [
          'Mbajeni fjalëkalimin tuaj privat dhe na njoftoni menjëherë nëse mendoni se dikush tjetër ka qasje në llogarinë tuaj. Ju jeni përgjegjës për porositë e bëra ndërsa jeni të kyçur në llogarinë tuaj.',
        ],
      },
      {
        heading: '9. Përgjegjësia',
        paragraphs: [
          'Synojmë të dërgojmë saktësisht atë që u porosit, në kohë dhe në gjendje të mirë. Kur diçka shkon keq nga ana jonë, Politika jonë e Rimbursimit shpjegon si e ndreqim — përgjegjësia jonë kufizohet në vlerën e vetë porosisë.',
        ],
      },
      {
        heading: '10. Ndryshimet e këtyre kushteve',
        paragraphs: ['Mund t’i përditësojmë këto kushte herë pas here; versioni aktual vlen gjithmonë për porositë e reja.'],
      },
      {
        heading: '11. Legjislacioni në fuqi',
        paragraphs: ['Këto kushte rregullohen nga ligjet e Republikës së Maqedonisë së Veriut.'],
      },
      {
        heading: '12. Kontakt',
        paragraphs: [`Pyetje rreth këtyre kushteve? Na kontaktoni në {{email}} ose {{phone}}.`],
      },
    ],
  },
};

export const PRIVACY_CONTENT: Record<Locale, LegalDoc> = {
  en: {
    title: 'Privacy Policy',
    intro: 'This explains what information Dekora collects, why, and how you can control it.',
    sections: [
      {
        heading: '1. What we collect',
        paragraphs: [
          "For an account: your name, email, phone number and a securely hashed password (we never store your actual password) — plus every order and points balance tied to that account.",
          'For a guest order: the name, phone, email and delivery address you enter at checkout, attached to that order only.',
        ],
      },
      {
        heading: '2. Why we collect it',
        paragraphs: [
          'To take and deliver your order, contact you to confirm details, run the loyalty points program for account holders, and improve the shop. We never sell or rent your data to anyone.',
        ],
      },
      {
        heading: '3. Cookies and local storage',
        paragraphs: [
          "We use your browser's local storage (not third-party tracking cookies) to keep you signed in, remember your cart, wishlist, language preference, and whether you've seen this notice. Nothing here is used for advertising or shared with ad networks.",
        ],
      },
      {
        heading: '4. Who we share it with',
        paragraphs: [
          "We share the minimum needed to deliver your order (name, phone, address) with whoever is doing that specific delivery. Otherwise your data stays with us.",
        ],
      },
      {
        heading: '5. How long we keep it',
        paragraphs: [
          "Order records are kept for our own accounting and in case of a dispute. Account data is kept until you ask us to delete it.",
        ],
      },
      {
        heading: '6. Your rights',
        paragraphs: [
          `You can ask us to see, correct, or delete the personal data we hold about you at any time — email {{email}} and we'll handle it.`,
        ],
      },
      {
        heading: '7. Children',
        paragraphs: ['Dekora is not directed at children under 16, and we don’t knowingly collect their data.'],
      },
      {
        heading: '8. Changes to this policy',
        paragraphs: ['If this policy changes meaningfully, we’ll update this page and the date below.'],
      },
      {
        heading: '9. Contact',
        paragraphs: [`Privacy questions go to {{email}} or {{phone}}.`],
      },
    ],
  },
  mk: {
    title: 'Политика за приватност',
    intro: 'Ова објаснува кои информации ги собира Dekora, зошто, и како можете да ги контролирате.',
    sections: [
      {
        heading: '1. Што собираме',
        paragraphs: [
          'За профил: вашето име, е-пошта, телефонски број и безбедно хеширана лозинка (никогаш не ја чуваме вашата вистинска лозинка) — плус секоја нарачка и салдо на поени поврзани со тој профил.',
          'За нарачка како гостин: името, телефонот, е-поштата и адресата за достава што ги внесувате при нарачка, поврзани само со таа нарачка.',
        ],
      },
      {
        heading: '2. Зошто ги собираме',
        paragraphs: [
          'За да ја примиме и испорачаме вашата нарачка, да ве контактираме за потврда на деталите, да ја водиме програмата за поени за лојалност за сопствениците на профили, и да ја подобруваме продавницата. Никогаш не ги продаваме или изнајмуваме вашите податоци на никого.',
        ],
      },
      {
        heading: '3. Колачиња и локално складирање',
        paragraphs: [
          'Го користиме локалното складирање на вашиот прелистувач (не колачиња за следење од трети страни) за да ве задржиме најавени, да ги запомниме вашата кошничка, листа со желби, јазична преференца и дали веќе сте ја виделе оваа порака. Ништо од ова не се користи за реклами и не се споделува со рекламни мрежи.',
        ],
      },
      {
        heading: '4. Со кого ги споделуваме',
        paragraphs: [
          'Го споделуваме минимумот потребен за да ја испорачаме вашата нарачка (име, телефон, адреса) со лицето кое ја врши таа конкретна достава. Во спротивно, вашите податоци остануваат кај нас.',
        ],
      },
      {
        heading: '5. Колку долго ги чуваме',
        paragraphs: [
          'Записите за нарачки се чуваат за наше сметководство и во случај на спор. Податоците за профилот се чуваат сè додека не побарате да ги избришеме.',
        ],
      },
      {
        heading: '6. Ваши права',
        paragraphs: [
          `Можете во секое време да побарате да ги видите, поправите или избришете личните податоци што ги чуваме за вас — пишете на {{email}} и ќе се погрижиме за тоа.`,
        ],
      },
      {
        heading: '7. Деца',
        paragraphs: ['Dekora не е наменета за деца под 16 години и свесно не собираме нивни податоци.'],
      },
      {
        heading: '8. Промени на оваа политика',
        paragraphs: ['Доколку оваа политика значајно се промени, ќе ја ажурираме оваа страница и датумот подолу.'],
      },
      {
        heading: '9. Контакт',
        paragraphs: [`Прашања за приватност праќајте на {{email}} или {{phone}}.`],
      },
    ],
  },
  sq: {
    title: 'Politika e Privatësisë',
    intro: 'Kjo shpjegon çfarë informacioni mbledh Dekora, pse, dhe si mund ta kontrolloni atë.',
    sections: [
      {
        heading: '1. Çfarë mbledhim',
        paragraphs: [
          'Për një llogari: emrin, email-in, numrin e telefonit dhe një fjalëkalim të koduar në mënyrë të sigurt (nuk e ruajmë kurrë fjalëkalimin tuaj real) — plus çdo porosi dhe bilanc pikësh të lidhur me atë llogari.',
          'Për një porosi si vizitor: emrin, telefonin, email-in dhe adresën e dërgesës që vendosni gjatë porosisë, të lidhura vetëm me atë porosi.',
        ],
      },
      {
        heading: '2. Pse i mbledhim',
        paragraphs: [
          'Për të marrë dhe dërguar porosinë tuaj, për t’ju kontaktuar për konfirmimin e detajeve, për të menaxhuar programin e pikëve të besnikërisë për mbajtësit e llogarive, dhe për të përmirësuar dyqanin. Nuk i shesim apo i japim me qira kurrë të dhënat tuaja askujt.',
        ],
      },
      {
        heading: '3. Cookies dhe ruajtja lokale',
        paragraphs: [
          'Përdorim ruajtjen lokale të shfletuesit tuaj (jo cookies gjurmuese nga palë të treta) për t’ju mbajtur të kyçur, për të mbajtur mend shportën, listën e dëshirave, preferencën e gjuhës dhe nëse e keni parë këtë njoftim. Asgjë këtu nuk përdoret për reklama apo ndahet me rrjete reklamash.',
        ],
      },
      {
        heading: '4. Me kë i ndajmë',
        paragraphs: [
          'Ndajmë minimumin e nevojshëm për të dërguar porosinë tuaj (emri, telefoni, adresa) me atë që kryen atë dërgesë specifike. Përndryshe, të dhënat tuaja mbeten tek ne.',
        ],
      },
      {
        heading: '5. Sa kohë i mbajmë',
        paragraphs: [
          'Të dhënat e porosive mbahen për kontabilitetin tonë dhe në rast mosmarrëveshjeje. Të dhënat e llogarisë mbahen derisa të na kërkoni t’i fshijmë.',
        ],
      },
      {
        heading: '6. Të drejtat tuaja',
        paragraphs: [
          `Mund të na kërkoni në çdo kohë të shihni, korrigjoni ose fshini të dhënat personale që mbajmë për ju — na shkruani në {{email}} dhe do ta trajtojmë.`,
        ],
      },
      {
        heading: '7. Fëmijët',
        paragraphs: ['Dekora nuk u drejtohet fëmijëve nën 16 vjeç dhe nuk mbledhim me vetëdije të dhënat e tyre.'],
      },
      {
        heading: '8. Ndryshimet e kësaj politike',
        paragraphs: ['Nëse kjo politikë ndryshon në mënyrë të konsiderueshme, do ta përditësojmë këtë faqe dhe datën më poshtë.'],
      },
      {
        heading: '9. Kontakt',
        paragraphs: [`Pyetjet për privatësinë dërgojini te {{email}} ose {{phone}}.`],
      },
    ],
  },
};

export const REFUND_CONTENT: Record<Locale, LegalDoc> = {
  en: {
    title: 'Refund Policy',
    intro:
      "Here's the honest, plain-language version of why most Dekora orders can't be refunded once we start making them — and what we do offer.",
    sections: [
      {
        heading: 'Why we generally don’t offer refunds',
        paragraphs: [
          "Every order is made by hand, specifically for you, after we call to confirm it. Satin bouquets, balloon boxes, baskets and custom text are all assembled to your exact order — so once preparation starts, that material and time can't be recovered.",
        ],
      },
      {
        heading: 'Free cancellation before we start',
        paragraphs: [
          'You can cancel or change your order at no cost any time before we begin preparing it — which is always after our confirmation call, never before. Just call or message us.',
        ],
      },
      {
        heading: 'If something arrives wrong or damaged',
        paragraphs: [
          "This is different from changing your mind, and we'll make it right. Contact us within 24 hours of delivery with a photo of the issue, and we'll offer a replacement or store credit, assessed case by case.",
        ],
      },
      {
        heading: 'Payment and refunds',
        paragraphs: [
          "Since most orders are paid for at the moment of delivery (cash), there's usually nothing to refund unless we've already made a mistake — see above.",
        ],
      },
      {
        heading: 'Questions',
        paragraphs: [`If you're ever unsure where your order stands, call or email us at {{email}} / {{phone}} — we'd rather sort it out with you directly than leave you guessing.`],
      },
    ],
  },
  mk: {
    title: 'Политика за рефундација',
    intro:
      'Еве искрено, едноставно објаснето зошто повеќето нарачки кај Dekora не можат да се рефундираат откако ќе почнеме да ги изработуваме — и што сепак нудиме.',
    sections: [
      {
        heading: 'Зошто најчесто не нудиме рефундација',
        paragraphs: [
          'Секоја нарачка се изработува рачно, конкретно за вас, откако ќе се јавиме телефонски за потврда. Сатенските букети, кутиите со балони, кошничките и персонализираниот текст се составуваат точно според вашата нарачка — па штом ќе започне подготовката, тој материјал и време не можат да се вратат.',
        ],
      },
      {
        heading: 'Бесплатно откажување пред да започнеме',
        paragraphs: [
          'Можете бесплатно да ја откажете или промените нарачката во секое време пред да започнеме со подготовка — што е секогаш по нашиот повик за потврда, никогаш пред тоа. Само јавете се или пишете ни.',
        ],
      },
      {
        heading: 'Ако нешто стигне погрешно или оштетено',
        paragraphs: [
          'Ова е поинаку од промена на мислење и ние ќе го поправиме тоа. Контактирајте нè во рок од 24 часа од доставата со фотографија од проблемот, а ние ќе понудиме замена или кредит за продавницата, проценето случај по случај.',
        ],
      },
      {
        heading: 'Плаќање и рефундации',
        paragraphs: [
          'Бидејќи повеќето нарачки се плаќаат во моментот на достава (во готово), обично нема што да се рефундира, освен ако веќе не сме направиле грешка — погледнете погоре.',
        ],
      },
      {
        heading: 'Прашања',
        paragraphs: [`Ако некогаш не сте сигурни каде е вашата нарачка, јавете се или пишете ни на {{email}} / {{phone}} — претпочитаме тоа да го разјасниме директно со вас, отколку да останете во недоумица.`],
      },
    ],
  },
  sq: {
    title: 'Politika e Rimbursimit',
    intro:
      'Ja shpjegimi i sinqertë, në gjuhë të thjeshtë, se pse shumica e porosive të Dekora-s nuk mund të rimbursohen pasi të fillojmë t’i bëjmë — dhe çfarë ofrojmë në vend të kësaj.',
    sections: [
      {
        heading: 'Pse zakonisht nuk ofrojmë rimbursim',
        paragraphs: [
          'Çdo porosi bëhet me dorë, posaçërisht për ju, pasi t’ju telefonojmë për konfirmim. Buqetat sateni, kutitë me balona, shportat dhe teksti i personalizuar përgatiten saktësisht sipas porosisë tuaj — kështu që sapo të fillojë përgatitja, ai material dhe kohë nuk mund të rikthehen.',
        ],
      },
      {
        heading: 'Anulim falas përpara se të fillojmë',
        paragraphs: [
          'Mund ta anuloni ose ndryshoni porosinë pa pagesë në çdo kohë përpara se të fillojmë përgatitjen — gjë që ndodh gjithmonë pas telefonatës sonë konfirmuese, kurrë përpara saj. Thjesht na telefononi ose na shkruani.',
        ],
      },
      {
        heading: 'Nëse diçka mbërrin e gabuar ose e dëmtuar',
        paragraphs: [
          'Kjo është ndryshe nga ndryshimi i mendjes, dhe ne do ta ndreqim. Na kontaktoni brenda 24 orëve nga dërgesa me një foto të problemit, dhe ne do të ofrojmë një zëvendësim ose kredit dyqani, të vlerësuar rast pas rasti.',
        ],
      },
      {
        heading: 'Pagesa dhe rimbursimet',
        paragraphs: [
          'Meqë shumica e porosive paguhen në momentin e dërgesës (para në dorë), zakonisht nuk ka asgjë për t’u rimbursuar, përveç nëse ne kemi bërë tashmë një gabim — shihni më lart.',
        ],
      },
      {
        heading: 'Pyetje',
        paragraphs: [`Nëse ndonjëherë nuk jeni të sigurt ku qëndron porosia juaj, na telefononi ose shkruani në {{email}} / {{phone}} — preferojmë ta sqarojmë drejtpërdrejt me ju sesa t’ju lëmë në pikëpyetje.`],
      },
    ],
  },
};
