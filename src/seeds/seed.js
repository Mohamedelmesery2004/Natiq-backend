

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import { Company, User, KnowledgeItem } from '../models/index.js';
import { ROLES, KNOWLEDGE_TYPE } from '../constants/index.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/natiq';

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      Company.deleteMany({}),
      User.deleteMany({}),
      KnowledgeItem.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    const company = await Company.create({
      name: 'Prime Store',
      slug: 'prime-store',
      industry: 'sports_retail',
      channelsConfig: {
        telegram: { 
          isActive: true,
          botToken: '8462814216:AAFrx9oIyJ0phTZWjp0ZZuHY1NbZRMqq7nQ'
        },
        whatsapp: { isActive: true },
        webChat: { isActive: true },
      },
      settings: {
        aiEnabled: true,
        escalationThreshold: 0.5,
        maxSessionMessages: 50,
      },
    });
    console.log(`Company created: ${company.name} (${company.slug})`);

    const superAdmin = await User.create({
      companyId: company._id,
      name: 'Platform Admin',
      email: 'admin@primestore.com',
      passwordHash: 'admin123',
      role: ROLES.PLATFORM_SUPER_ADMIN,
    });
    console.log(`Super Admin: ${superAdmin.email} / admin123`);

    const owner = await User.create({
      companyId: company._id,
      name: 'Owner Prime Store',
      email: 'owner@primestore.com',
      passwordHash: 'owner123',
      role: ROLES.COMPANY_OWNER,
    });
    console.log(`Company Owner: ${owner.email} / owner123`);

    const manager = await User.create({
      companyId: company._id,
      name: 'Ahmad Al-Manager',
      email: 'manager@primestore.com',
      passwordHash: 'manager123',
      role: ROLES.COMPANY_MANAGER,
    });
    console.log(`Company Manager: ${manager.email} / manager123`);

    const teamLeader = await User.create({
      companyId: company._id,
      name: 'Sara Team-Leader',
      email: 'teamlead@primestore.com',
      passwordHash: 'teamlead123',
      role: ROLES.TEAM_LEADER,
    });
    console.log(`Team Leader: ${teamLeader.email} / teamlead123`);

    const agent1 = await User.create({
      companyId: company._id,
      name: 'Omar Agent',
      email: 'omar@primestore.com',
      passwordHash: 'agent123',
      role: ROLES.AGENT,
      teamLeaderId: teamLeader._id,
    });
    console.log(`Agent: ${agent1.email} / agent123`);

    const agent2 = await User.create({
      companyId: company._id,
      name: 'Fatima Agent',
      email: 'fatima@primestore.com',
      passwordHash: 'agent123',
      role: ROLES.AGENT,
      teamLeaderId: teamLeader._id,
    });
    console.log(`Agent: ${agent2.email} / agent123`);

    const customer = await User.create({
      companyId: company._id,
      name: 'Khaled Customer',
      email: 'khaled@example.com',
      passwordHash: 'customer123',
      phone: '+964770123456',
      role: ROLES.CUSTOMER,
    });
    console.log(`Customer: ${customer.email} / customer123`);

    const knowledgeItems = [
      {
        companyId: company._id,
        type: KNOWLEDGE_TYPE.PACKAGE,
        title: 'تيشرت ريال مدريد الأساسي 2024',
        subtitle: 'أعلى جودة ميرور أوريجينال',
        content:
          'تيشرت ريال مدريد الأساسي للموسم الجديد، خامة دراي فيت مريحة جداً ومضادة للتعرق. السعر: 450 جنيه. متاح جميع المقاسات من S لـ XXL. التوصيل متوفر لجميع المحافظات خلال 3-5 أيام عمل.',
        features: ['خامة دراي فيت', 'مضاد للتعرق', 'جميع المقاسات'],
        slug: 'real-madrid-home-2024',
      },
      {
        companyId: company._id,
        type: KNOWLEDGE_TYPE.PACKAGE,
        title: 'حذاء كرة قدم نايك ميركوريال',
        subtitle: 'للعشب الصناعي والطبيعي',
        content:
          'حذاء نايك ميركوريال بجودة عالية، يتميز بخفة الوزن والسرعة في الملعب. السعر: 1200 جنيه. المقاسات المتاحة من 40 إلى 45. الشحن مجاني عند الدفع المسبق.',
        features: ['خفيف الوزن', 'مناسب للعشب الصناعي', 'مريح للقدم'],
        slug: 'nike-mercurial-shoes',
      },
      {
        companyId: company._id,
        type: KNOWLEDGE_TYPE.PACKAGE,
        title: 'تيشرت مانشستر سيتي الاحتياطي 2024',
        subtitle: 'ألوان جذابة وخامة ممتازة',
        content:
          'تيشرت السيتي الجديد باللون الداكن، مناسب للمباريات والخروج العفوي. السعر: 450 جنيه. التوصيل لباب البيت.',
        features: ['خامة ممتازة', 'ألوان ثابتة', 'مريح'],
        slug: 'man-city-away-2024',
      },
      {
        companyId: company._id,
        type: KNOWLEDGE_TYPE.FAQ,
        title: 'طرق الدفع وتكلفة الشحن',
        content:
          'بنقبل الدفع عند الاستلام، أو الدفع المقدم عن طريق فودافون كاش ومحافظ إلكترونية تانية. مصاريف الشحن بتكون 45 جنيه للقاهرة والجيزة، و60 جنيه لباقي المحافظات. الشحن بياخد من يومين لـ 5 أيام عمل بالكثير.',
        features: ['دفع عند الاستلام', 'فودافون كاش', 'محافظ إلكترونية'],
        slug: 'payment-and-shipping',
      },
      {
        companyId: company._id,
        type: KNOWLEDGE_TYPE.FAQ,
        title: 'كيفية اختيار مقاس التيشرت والحذاء المناسب',
        content:
          'عشان تختار المقاس صح، بننصحك دايماً تشوف جدول المقاسات بتاعنا المرفق مع كل منتج. لو محتار بين مقاسين في الأحذية الرياضية، الأفضل تاخد المقاس الأكبر نمرة. ولو مش متأكد، فريق المبيعات هيساعدك تأكد المقاس قبل شحن الأوردر.',
        features: ['جدول مقاسات', 'دليل اختيار المقاس'],
        slug: 'how-to-choose-size',
      },
      {
        companyId: company._id,
        type: KNOWLEDGE_TYPE.FAQ,
        title: 'سياسة الاستبدال والاسترجاع',
        content:
          'يمكنك الاستبدال أو الاسترجاع خلال 14 يوم من تاريخ استلام الطلب، بشرط أن يكون المنتج في حالته الأصلية ومرفق مع الجلاد أو الكرتونة الخاصة بيه. مصاريف شحن الاستبدال يتحملها العميل إلا لو فيه عيب صناعة في المنتج.',
        features: ['إرجاع خلال 14 يوم', 'استبدال وتغيير مقاس', 'ضمان عيوب'],
        slug: 'return-policy',
      },
      {
        companyId: company._id,
        type: KNOWLEDGE_TYPE.POLICY,
        title: 'مواعيد العمل',
        content:
          'فريق دعم برايم ستور متاح لخدمتكم يومياً من الساعة 10 صباحاً وحتى 10 مساءً، ما عدا الجمعة بنكون متاحين من 2 ظهراً لـ 10 مساءً.',
        slug: 'working-hours',
      },
      {
        companyId: company._id,
        type: KNOWLEDGE_TYPE.POLICY,
        title: 'جودة الأحذية',
        content:
          'جميع الأحذية عندنا ميرور أوريجينال بنسبة 100% وبنفس خامات ومواصفات الأصلي، مناسبة جداً للعب الكورة سواء على النجيل الصناعي أو الطبيعي حسب وصف كل موديل.',
        slug: 'shoes-quality',
      },
      {
        companyId: company._id,
        type: KNOWLEDGE_TYPE.COMPLAINT_FLOW,
        title: 'طريقة رفع الشكاوى',
        content:
          'لو عندك أي مشكلة أو تأخير في الشحن: 1) تواصل معانا هنا على الشات، 2) سيقوم أحد ممثلي الخدمة بفتح تذكرة وتصعيد الموضوع لشركة الشحن، 3) يتم حل المشكلة خلال 48 ساعة بالكثير.',
        slug: 'complaint-resolution',
      },
      {
        companyId: company._id,
        type: KNOWLEDGE_TYPE.COMPLAINT_FLOW,
        title: 'مشاكل استلام منتج مختلف',
        content:
          'في العادة لا نخطئ في تجهيز الطلبات، لكن في حال استلمت موديل أو مقاس مختلف عن طلبك، يرجى إرسال صورة المنتج هنا وسنقوم بتوصيل المنتج الصحيح فوراً مجاناً وسحب المنتج الخطأ.',
        slug: 'wrong-item-complaint',
      },
    ];

    const created = await KnowledgeItem.insertMany(knowledgeItems);
    console.log(`\nCreated ${created.length} knowledge base items`);

    console.log('\n==========================================');
    console.log('  SEED COMPLETE');
    console.log('==========================================');
    console.log(`\nCompany: ${company.name} (slug: ${company.slug})`);
    console.log('Test Accounts:');
    console.log('  Super Admin:  admin@primestore.com / admin123');
    console.log('  Owner:        owner@primestore.com / owner123');
    console.log('  Manager:      manager@primestore.com / manager123');
    console.log('  Team Leader:  teamlead@primestore.com / teamlead123');
    console.log('  Agent (Omar): omar@primestore.com / agent123');
    console.log('  Agent (Fatima): fatima@primestore.com / agent123');
    console.log('  Customer:     khaled@example.com / customer123');
    console.log('\nKnowledge Base: 10 items (3 packages, 3 FAQs, 2 policies, 2 complaint flows)');
    console.log('\nNext steps:');
    console.log('  1. npm run dev');
    console.log('  2. Login: POST /api/v1/auth/login { email, password, companySlug: "prime-store" }');
    console.log('  3. Sync embeddings: POST /api/v1/admin/embeddings/sync');
    console.log('  4. Manager audit logs: GET /api/v1/admin/management/audit-logs');
    console.log('  5. RBAC matrix: GET /api/v1/admin/management/rbac-matrix');
    console.log('  6. CSV exports: GET /api/v1/admin/management/exports/calls|tickets|analytics-summary');
    console.log('  4. Start chatting: POST /api/v1/chat/sessions + POST /api/v1/chat/sessions/:id/messages');
    console.log('==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
