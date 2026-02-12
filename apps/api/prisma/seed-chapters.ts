import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding chapters for all subjects...');

    const chaptersData: Record<string, Array<{ title: string; titleAr: string; duration: number; difficulty: string }>> = {
        'Mathématiques': [
            { title: 'Nombres complexes — Forme algébrique et trigonométrique', titleAr: 'الأعداد المركّبة - الشكل الجبري والمثلثي', duration: 180, difficulty: 'HARD' },
            { title: 'Nombres complexes — Forme exponentielle et applications géométriques', titleAr: 'الأعداد المركّبة - الشكل الأسّي والتطبيقات الهندسية', duration: 180, difficulty: 'HARD' },
            { title: 'Suites numériques — Suites arithmétiques et géométriques', titleAr: 'المتتاليات العددية - المتتاليات الحسابية والهندسية', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Suites numériques — Convergence et suites adjacentes', titleAr: 'المتتاليات العددية - التقارب والمتتاليات المتجاورة', duration: 150, difficulty: 'HARD' },
            { title: 'Limites et continuité', titleAr: 'النهايات والاتصال', duration: 180, difficulty: 'MEDIUM' },
            { title: 'Dérivabilité et étude de fonctions', titleAr: 'الاشتقاق ودراسة الدوال', duration: 200, difficulty: 'HARD' },
            { title: 'Fonction logarithme népérien', titleAr: 'الدالة اللوغاريتمية النيبيرية', duration: 180, difficulty: 'HARD' },
            { title: 'Fonction exponentielle', titleAr: 'الدالة الأسّية', duration: 180, difficulty: 'HARD' },
            { title: 'Calcul intégral', titleAr: 'التكامل', duration: 180, difficulty: 'HARD' },
            { title: 'Équations différentielles', titleAr: 'المعادلات التفاضلية', duration: 150, difficulty: 'HARD' },
            { title: 'Dénombrement', titleAr: 'التعداد', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Probabilités', titleAr: 'الاحتمالات', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Arithmétique — Divisibilité et congruences', titleAr: 'الحسابيات - القسمة والتطابقات', duration: 150, difficulty: 'HARD' },
            { title: 'Arithmétique — PGCD, théorème de Bézout et Gauss', titleAr: 'الحسابيات - القاسم المشترك الأكبر ومبرهنتا بيزو وغوس', duration: 150, difficulty: 'HARD' },
        ],
        'Physique': [
            { title: 'Évolution de systèmes chimiques', titleAr: 'تطوّر جمل كيميائية', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Cinétique chimique — Vitesse de réaction', titleAr: 'الحركيّة الكيميائية - سرعة التفاعل', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Équilibre chimique', titleAr: 'التوازن الكيميائي', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Acides et bases — pH et réactions acido-basiques', titleAr: 'الأحماض والقواعد', duration: 150, difficulty: 'MEDIUM' },
            { title: "Mouvement de rotation d'un solide autour d'un axe fixe", titleAr: 'حركة دوران جسم صلب حول محور ثابت', duration: 180, difficulty: 'HARD' },
            { title: 'Mouvement de translation rectiligne', titleAr: 'حركة الانسحاب المستقيمي', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Oscillations mécaniques libres', titleAr: 'التذبذبات الميكانيكية الحرّة', duration: 180, difficulty: 'HARD' },
            { title: 'Oscillations mécaniques forcées — Résonance', titleAr: 'التذبذبات الميكانيكية القسرية - الرنين', duration: 150, difficulty: 'HARD' },
            { title: 'Oscillations électriques libres dans un circuit RLC', titleAr: 'التذبذبات الكهربائية الحرّة في دارة RLC', duration: 180, difficulty: 'HARD' },
            { title: 'Oscillations électriques forcées', titleAr: 'التذبذبات الكهربائية القسرية', duration: 150, difficulty: 'HARD' },
            { title: 'Ondes mécaniques progressives', titleAr: 'الأمواج الميكانيكية المتقدمة', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Ondes lumineuses — Diffraction et interférences', titleAr: 'الأمواج الضوئية - الحيود والتداخل', duration: 150, difficulty: 'HARD' },
            { title: 'Radioactivité et réactions nucléaires', titleAr: 'النشاط الإشعاعي والتفاعلات النووية', duration: 120, difficulty: 'MEDIUM' },
        ],
        'Sciences naturelles': [
            { title: "Reproduction humaine — Fonction reproductrice chez l'homme", titleAr: 'التكاثر عند الإنسان - الوظيفة التناسلية عند الرجل', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Reproduction humaine — Fonction reproductrice chez la femme', titleAr: 'التكاثر عند الإنسان - الوظيفة التناسلية عند المرأة', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Reproduction humaine — Fécondation, grossesse et régulation des naissances', titleAr: 'الإخصاب والحمل وتنظيم النسل', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Génétique humaine — Hérédité autosomale', titleAr: 'الوراثة عند الإنسان - الوراثة الذاتية', duration: 180, difficulty: 'HARD' },
            { title: 'Génétique humaine — Hérédité liée au sexe et anomalies chromosomiques', titleAr: 'الوراثة المرتبطة بالجنس والشذوذ الصبغي', duration: 150, difficulty: 'HARD' },
            { title: 'Immunologie — Le soi et le non-soi', titleAr: 'المناعة - الذات واللاذات', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Immunologie — Réponse immunitaire spécifique', titleAr: 'المناعة - الاستجابة المناعية النوعية', duration: 180, difficulty: 'HARD' },
            { title: "Immunologie — Dysfonctionnements et aide à l'immunité", titleAr: 'اختلالات المناعة ودعمها', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Neurophysiologie — Le réflexe myotatique', titleAr: 'الفيزيولوجيا العصبية - المنعكس العضلي', duration: 150, difficulty: 'HARD' },
            { title: 'Neurophysiologie — Le message nerveux et la synapse', titleAr: 'الرسالة العصبية والمشبك', duration: 150, difficulty: 'HARD' },
            { title: 'Géologie — La tectonique des plaques', titleAr: 'الجيولوجيا - تكتونية الصفائح', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Géologie — Les phénomènes géologiques associés', titleAr: 'الظواهر الجيولوجية المصاحبة', duration: 120, difficulty: 'MEDIUM' },
        ],
        'Informatique': [
            { title: "Systèmes de numération et codage de l'information", titleAr: 'أنظمة العدّ وترميز المعلومة', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Les opérateurs logiques et algèbre de Boole', titleAr: 'العمليات المنطقية وجبر بول', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Les structures de données — Tableaux et enregistrements', titleAr: 'بنى المعطيات - الجداول والتسجيلات', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Les algorithmes de tri — Tri par sélection et tri à bulles', titleAr: 'خوارزميات الترتيب - الترتيب بالاختيار والترتيب الفقاعي', duration: 150, difficulty: 'HARD' },
            { title: 'Les algorithmes de recherche', titleAr: 'خوارزميات البحث', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Les sous-programmes — Fonctions et procédures', titleAr: 'البرامج الفرعية - الدوال والإجراءات', duration: 150, difficulty: 'MEDIUM' },
            { title: 'La récursivité', titleAr: 'التعاودية', duration: 150, difficulty: 'HARD' },
            { title: 'Les fichiers texte — Lecture et écriture', titleAr: 'الملفات النصّية - القراءة والكتابة', duration: 120, difficulty: 'MEDIUM' },
        ],
        'Français': [
            { title: 'Le texte argumentatif — Structure et techniques', titleAr: 'النص الحجاجي - البنية والتقنيات', duration: 150, difficulty: 'MEDIUM' },
            { title: "L'essai littéraire", titleAr: 'المقال الأدبي', duration: 150, difficulty: 'HARD' },
            { title: 'Le commentaire composé — Méthodologie', titleAr: 'التعليق المركّب - المنهجية', duration: 180, difficulty: 'HARD' },
            { title: 'La dissertation littéraire', titleAr: 'المقالة الأدبية', duration: 180, difficulty: 'HARD' },
            { title: 'Le roman et le récit — Analyse narrative', titleAr: 'الرواية والسرد - التحليل السردي', duration: 150, difficulty: 'MEDIUM' },
            { title: 'La poésie — Versification et figures de style', titleAr: 'الشعر - الأوزان والصور البلاغية', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Le théâtre — Genres et analyse dramatique', titleAr: 'المسرح - الأنواع والتحليل المسرحي', duration: 120, difficulty: 'MEDIUM' },
            { title: 'La contraction de texte et le résumé', titleAr: 'تلخيص النصوص', duration: 120, difficulty: 'MEDIUM' },
        ],
        'Arabe': [
            { title: 'المحور 1: في الفكر والفنّ — الشعر الجاهلي', titleAr: 'الشعر الجاهلي ومعلّقاته', duration: 150, difficulty: 'MEDIUM' },
            { title: 'المحور 2: من شواغل الفكر العربي — قضايا المرأة', titleAr: 'قضايا المرأة في الأدب العربي', duration: 150, difficulty: 'MEDIUM' },
            { title: 'المحور 3: من شواغل عالمنا المعاصر — العولمة والهوية', titleAr: 'العولمة والهوية', duration: 150, difficulty: 'HARD' },
            { title: 'المحور 4: في التواصل — الخطاب والحجاج', titleAr: 'الخطاب والحجاج', duration: 120, difficulty: 'MEDIUM' },
            { title: 'المحور 5: الأدب القصصي — فنّ القصّة والرواية', titleAr: 'فن القصة القصيرة والرواية', duration: 150, difficulty: 'MEDIUM' },
            { title: 'المحور 6: الشعر الحديث والمعاصر', titleAr: 'الشعر الحديث والمعاصر', duration: 150, difficulty: 'MEDIUM' },
            { title: 'المحور 7: المسرح العربي', titleAr: 'المسرح العربي', duration: 120, difficulty: 'MEDIUM' },
            { title: 'النحو والصرف — تراكيب الجملة والإعراب', titleAr: 'النحو والصرف', duration: 180, difficulty: 'HARD' },
            { title: 'البلاغة — البيان والبديع والمعاني', titleAr: 'البلاغة العربية', duration: 150, difficulty: 'HARD' },
            { title: 'منهجية تحليل النصّ والإنشاء الأدبي', titleAr: 'منهجية تحليل النص', duration: 150, difficulty: 'HARD' },
        ],
        'Anglais': [
            { title: 'Unit 1: Education — Schooling Systems and Learning', titleAr: 'الوحدة 1: التعليم', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Unit 2: Technology and Innovation', titleAr: 'الوحدة 2: التكنولوجيا والابتكار', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Unit 3: Environment and Sustainability', titleAr: 'الوحدة 3: البيئة والتنمية المستدامة', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Unit 4: Health and Well-being', titleAr: 'الوحدة 4: الصحة والرفاهية', duration: 120, difficulty: 'EASY' },
            { title: 'Unit 5: Culture and Society — Tunisian Identity', titleAr: 'الوحدة 5: الثقافة والمجتمع', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Unit 6: Travel, Tourism and Communication', titleAr: 'الوحدة 6: السفر والسياحة', duration: 120, difficulty: 'EASY' },
            { title: 'Grammar Review — Tenses, Modals, Conditionals', titleAr: 'مراجعة القواعد - الأزمنة والشرط', duration: 150, difficulty: 'HARD' },
            { title: 'Writing Skills — Essays, Letters and Reports', titleAr: 'مهارات الكتابة - المقالات والرسائل', duration: 150, difficulty: 'HARD' },
        ],
        'Philosophie': [
            { title: 'La pensée — Nature et mécanismes de la pensée', titleAr: 'التفكير - طبيعة التفكير وآلياته', duration: 150, difficulty: 'HARD' },
            { title: "La conscience et l'inconscient", titleAr: 'الوعي واللاوعي', duration: 150, difficulty: 'HARD' },
            { title: 'La liberté — Déterminisme et libre arbitre', titleAr: 'الحرية - الحتمية والإرادة الحرة', duration: 150, difficulty: 'HARD' },
            { title: 'Le devoir et la morale', titleAr: 'الواجب والأخلاق', duration: 120, difficulty: 'MEDIUM' },
            { title: 'La justice et le droit', titleAr: 'العدالة والقانون', duration: 120, difficulty: 'MEDIUM' },
            { title: 'La vérité — Critères et obstacles', titleAr: 'الحقيقة - المعايير والعوائق', duration: 150, difficulty: 'HARD' },
            { title: 'La science entre théorie et expérience', titleAr: 'العلم بين النظرية والتجربة', duration: 150, difficulty: 'HARD' },
            { title: "L'art et le beau", titleAr: 'الفنّ والجمال', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Le travail et la technique', titleAr: 'العمل والتقنية', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Méthodologie de la dissertation philosophique', titleAr: 'منهجية المقالة الفلسفية', duration: 180, difficulty: 'HARD' },
        ],
        'Histoire-Géographie': [
            { title: "La Tunisie de 1945 à 1956 — Mouvement national et indépendance", titleAr: 'تونس من 1945 إلى 1956 - الحركة الوطنية والاستقلال', duration: 150, difficulty: 'MEDIUM' },
            { title: "La Tunisie depuis l'indépendance — Construction de l'État", titleAr: 'تونس منذ الاستقلال - بناء الدولة', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Le monde arabe — Problèmes et enjeux contemporains', titleAr: 'العالم العربي - المشاكل والرهانات المعاصرة', duration: 120, difficulty: 'MEDIUM' },
            { title: 'La question palestinienne', titleAr: 'القضية الفلسطينية', duration: 120, difficulty: 'MEDIUM' },
            { title: "La décolonisation en Afrique et en Asie", titleAr: 'تصفية الاستعمار في أفريقيا وآسيا', duration: 120, difficulty: 'MEDIUM' },
            { title: 'La Guerre froide et le nouvel ordre mondial', titleAr: 'الحرب الباردة والنظام العالمي الجديد', duration: 150, difficulty: 'HARD' },
            { title: 'La mondialisation — Flux, acteurs et enjeux', titleAr: 'العولمة - التدفقات والفاعلون والرهانات', duration: 150, difficulty: 'HARD' },
            { title: "L'espace tunisien — Organisation et aménagement du territoire", titleAr: 'الفضاء التونسي - تنظيم المجال وتهيئته', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Les puissances économiques mondiales — USA, UE, Japon, Chine', titleAr: 'القوى الاقتصادية العالمية', duration: 150, difficulty: 'HARD' },
            { title: 'Les pays en développement — Défis et perspectives', titleAr: 'البلدان النامية - التحديات والآفاق', duration: 120, difficulty: 'MEDIUM' },
        ],
        'Économie': [
            { title: "Le marché — Offre, demande et formation des prix", titleAr: 'السوق - العرض والطلب وتشكّل الأسعار', duration: 150, difficulty: 'MEDIUM' },
            { title: "La monnaie et le financement de l'économie", titleAr: 'النقود وتمويل الاقتصاد', duration: 150, difficulty: 'HARD' },
            { title: "L'entreprise et la production", titleAr: 'المؤسسة والإنتاج', duration: 120, difficulty: 'MEDIUM' },
            { title: 'La croissance économique — Mesure et facteurs', titleAr: 'النمو الاقتصادي - القياس والعوامل', duration: 150, difficulty: 'HARD' },
            { title: 'Le développement durable', titleAr: 'التنمية المستدامة', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Le commerce international — Échanges et balance commerciale', titleAr: 'التجارة الدولية - المبادلات والميزان التجاري', duration: 150, difficulty: 'HARD' },
            { title: "Le chômage et les politiques de l'emploi", titleAr: 'البطالة وسياسات التشغيل', duration: 120, difficulty: 'MEDIUM' },
            { title: "L'inflation — Causes, conséquences et politiques", titleAr: 'التضخم - الأسباب والنتائج والسياسات', duration: 120, difficulty: 'MEDIUM' },
            { title: "Le budget de l'État et la politique budgétaire", titleAr: 'ميزانية الدولة والسياسة الميزانية', duration: 150, difficulty: 'HARD' },
            { title: "L'intégration économique régionale — UMA et Union européenne", titleAr: 'الاندماج الاقتصادي الجهوي', duration: 120, difficulty: 'MEDIUM' },
        ],
        'Gestion': [
            { title: "L'analyse du bilan — Bilan fonctionnel et financier", titleAr: 'تحليل الميزانية - الميزانية الوظيفية والمالية', duration: 180, difficulty: 'HARD' },
            { title: 'Le compte de résultat — Produits, charges et soldes intermédiaires', titleAr: 'حساب النتائج - الإيرادات والأعباء', duration: 150, difficulty: 'HARD' },
            { title: 'Le calcul des coûts — Coûts complets', titleAr: 'حساب التكاليف - التكاليف الكاملة', duration: 180, difficulty: 'HARD' },
            { title: 'Le calcul des coûts — Coûts partiels et seuil de rentabilité', titleAr: 'التكاليف الجزئية وعتبة المردودية', duration: 150, difficulty: 'HARD' },
            { title: 'La gestion budgétaire — Prévisions et contrôle', titleAr: 'التسيير الميزاني - التوقعات والمراقبة', duration: 150, difficulty: 'HARD' },
            { title: 'La gestion des stocks — Méthodes et optimisation', titleAr: 'تسيير المخزونات - الطرق والتحسين', duration: 120, difficulty: 'MEDIUM' },
            { title: "L'analyse financière — Ratios et tableau de financement", titleAr: 'التحليل المالي - النسب وجدول التمويل', duration: 180, difficulty: 'HARD' },
            { title: 'Les investissements — Choix et rentabilité (VAN, TRI)', titleAr: 'الاستثمارات - الاختيار والمردودية', duration: 150, difficulty: 'HARD' },
            { title: 'La comptabilité des sociétés', titleAr: 'محاسبة الشركات', duration: 150, difficulty: 'HARD' },
        ],
        'Technologie': [
            { title: 'Analyse fonctionnelle — Cahier des charges et diagrammes', titleAr: 'التحليل الوظيفي - كراس الشروط والرسوم البيانية', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Grafcet — Automatismes séquentiels', titleAr: 'غرافسات - الآليات المتتابعة', duration: 180, difficulty: 'HARD' },
            { title: 'Logique combinatoire et circuits logiques', titleAr: 'المنطق التوافقي والدارات المنطقية', duration: 150, difficulty: 'HARD' },
            { title: 'Les liaisons mécaniques — Modélisation et schémas', titleAr: 'الروابط الميكانيكية - النمذجة والرسومات', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Résistance des matériaux — Traction, compression, flexion', titleAr: 'مقاومة المواد - الشد والضغط والانحناء', duration: 180, difficulty: 'HARD' },
            { title: 'Cinématique — Mouvement de translation et rotation', titleAr: 'الحركيات - حركة الانسحاب والدوران', duration: 150, difficulty: 'HARD' },
            { title: 'Dynamique — Principe fondamental de la dynamique', titleAr: 'الديناميكا - المبدأ الأساسي للديناميكا', duration: 150, difficulty: 'HARD' },
            { title: 'Transmission de puissance — Engrenages, poulies, courroies', titleAr: 'نقل القدرة - المسننات والبكرات والسيور', duration: 150, difficulty: 'MEDIUM' },
            { title: "Fabrication mécanique — Procédés d'usinage", titleAr: 'التصنيع الميكانيكي - طرق التشغيل', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Dessin technique — Projections et cotation', titleAr: 'الرسم الصناعي - الإسقاطات والتبعيد', duration: 120, difficulty: 'MEDIUM' },
        ],
        'Algorithmique': [
            { title: "Analyse et conception d'algorithmes — Approche descendante", titleAr: 'تحليل وتصميم الخوارزميات - المقاربة التنازلية', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Les structures de données avancées — Piles et files', titleAr: 'بنى المعطيات المتقدمة - الأكداس والأرتال', duration: 150, difficulty: 'HARD' },
            { title: 'Les algorithmes de tri avancés — Tri par insertion et tri rapide', titleAr: 'خوارزميات الترتيب المتقدمة - الترتيب بالإدراج والترتيب السريع', duration: 180, difficulty: 'HARD' },
            { title: 'La récursivité — Principes et applications', titleAr: 'التعاودية - المبادئ والتطبيقات', duration: 180, difficulty: 'HARD' },
            { title: 'Les arbres binaires — Parcours et opérations', titleAr: 'الأشجار الثنائية - الاجتياز والعمليات', duration: 180, difficulty: 'HARD' },
            { title: 'Les arbres binaires de recherche', titleAr: 'أشجار البحث الثنائية', duration: 150, difficulty: 'HARD' },
            { title: 'Les algorithmes de recherche avancés', titleAr: 'خوارزميات البحث المتقدمة', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Complexité algorithmique — Notions de base', titleAr: 'التعقيد الخوارزمي - المفاهيم الأساسية', duration: 120, difficulty: 'HARD' },
            { title: 'Les graphes — Représentation et parcours', titleAr: 'البيانات - التمثيل والاجتياز', duration: 150, difficulty: 'HARD' },
            { title: 'Programmation dynamique — Principes et exemples', titleAr: 'البرمجة الديناميكية - المبادئ والأمثلة', duration: 150, difficulty: 'HARD' },
        ],
        'Bases de données': [
            { title: 'Introduction aux bases de données et SGBD', titleAr: 'مدخل إلى قواعد البيانات ونظم إدارتها', duration: 90, difficulty: 'EASY' },
            { title: 'Modèle conceptuel de données (MCD) — Entités et associations', titleAr: 'النموذج التصوّري للمعطيات - الكيانات والعلاقات', duration: 150, difficulty: 'HARD' },
            { title: 'Passage du MCD au modèle relationnel (MLD)', titleAr: 'الانتقال من النموذج التصوري إلى النموذج العلائقي', duration: 120, difficulty: 'MEDIUM' },
            { title: "L'algèbre relationnelle — Opérations ensemblistes", titleAr: 'الجبر العلائقي - العمليات المجموعاتية', duration: 150, difficulty: 'HARD' },
            { title: "Le langage SQL — Requêtes d'interrogation (SELECT)", titleAr: 'لغة SQL - استعلامات الاستجواب', duration: 150, difficulty: 'MEDIUM' },
            { title: "Le langage SQL — Fonctions d'agrégation et regroupement", titleAr: 'لغة SQL - دوال التجميع والتقسيم', duration: 150, difficulty: 'HARD' },
            { title: 'Le langage SQL — Requêtes de mise à jour (INSERT, UPDATE, DELETE)', titleAr: 'لغة SQL - استعلامات التحديث', duration: 120, difficulty: 'MEDIUM' },
            { title: 'Le langage SQL — Jointures et sous-requêtes', titleAr: 'لغة SQL - الربط والاستعلامات الفرعية', duration: 180, difficulty: 'HARD' },
            { title: 'Normalisation des bases de données — 1FN, 2FN, 3FN', titleAr: 'تسوية قواعد البيانات', duration: 150, difficulty: 'HARD' },
            { title: 'Création et gestion de bases de données (DDL)', titleAr: 'إنشاء وتسيير قواعد البيانات', duration: 120, difficulty: 'MEDIUM' },
        ],
        'Éducation physique': [
            { title: 'Athlétisme — Course de vitesse et de demi-fond', titleAr: 'ألعاب القوى - سباقات السرعة ونصف المسافة', duration: 180, difficulty: 'MEDIUM' },
            { title: 'Athlétisme — Sauts et lancers', titleAr: 'ألعاب القوى - القفز والرمي', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Sports collectifs — Football et handball', titleAr: 'الرياضات الجماعية - كرة القدم وكرة اليد', duration: 180, difficulty: 'MEDIUM' },
            { title: 'Sports collectifs — Basketball et volleyball', titleAr: 'الرياضات الجماعية - كرة السلة والكرة الطائرة', duration: 180, difficulty: 'MEDIUM' },
            { title: 'Gymnastique — Sol et agrès', titleAr: 'الجمباز - الحركات الأرضية والأجهزة', duration: 150, difficulty: 'HARD' },
            { title: 'Natation — Techniques de nage et sauvetage', titleAr: 'السباحة - تقنيات السباحة والإنقاذ', duration: 150, difficulty: 'MEDIUM' },
            { title: 'Sports de combat — Lutte et judo', titleAr: 'رياضات القتال - المصارعة والجيدو', duration: 120, difficulty: 'MEDIUM' },
            { title: "Physiologie de l'effort et entraînement sportif", titleAr: 'فيزيولوجيا الجهد والتدريب الرياضي', duration: 180, difficulty: 'HARD' },
            { title: "Méthodologie de l'entraînement et planification", titleAr: 'منهجية التدريب والتخطيط', duration: 150, difficulty: 'HARD' },
            { title: 'Règlementation et arbitrage', titleAr: 'التنظيم والتحكيم', duration: 90, difficulty: 'EASY' },
        ],
    };

    let totalChapters = 0;

    for (const [subjectName, chapters] of Object.entries(chaptersData)) {
        const subject = await prisma.subject.findUnique({
            where: { name: subjectName },
        });

        if (!subject) {
            console.warn(`⚠️ Matière "${subjectName}" non trouvée, ignorée.`);
            continue;
        }

        // Delete existing chapters
        await prisma.chapter.deleteMany({
            where: { subjectId: subject.id },
        });

        // Create all chapters
        for (let i = 0; i < chapters.length; i++) {
            const ch = chapters[i];
            await prisma.chapter.create({
                data: {
                    subjectId: subject.id,
                    title: ch.title,
                    titleAr: ch.titleAr,
                    order: i + 1,
                    duration: ch.duration,
                    difficulty: ch.difficulty,
                },
            });
            totalChapters++;
        }

        console.log(`✅ ${chapters.length} chapitres créés pour "${subjectName}"`);
    }

    console.log(`\n🎉 Total: ${totalChapters} chapitres créés pour ${Object.keys(chaptersData).length} matières`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
