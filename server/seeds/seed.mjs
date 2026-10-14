import mongoose from 'mongoose';
import { connectDB } from '../config/db.mjs';
import { User } from '../models/User.mjs';
import { Club } from '../models/Club.mjs';
import { ClubMembership } from '../models/ClubMembership.mjs';
import { Announcement } from '../models/Announcement.mjs';
import { Event } from '../models/Event.mjs';
import { EventRegistration } from '../models/EventRegistration.mjs';
import { Project } from '../models/Project.mjs';
import { CommunityPost } from '../models/CommunityPost.mjs';
import { Resource } from '../models/Resource.mjs';
import { CampusService } from '../models/CampusService.mjs';
import { Product } from '../models/Product.mjs';
import { Timetable } from '../models/Timetable.mjs';
import { Conversation } from '../models/Conversation.mjs';
import { Message } from '../models/Message.mjs';
import { Notification } from '../models/Notification.mjs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function seedDatabase() {
  await connectDB();
  console.info('[Seed] Checking database collections...');

  // 1. Seed Users
  let admin = await User.findOne({ email: 'admin@vynora.edu' });
  if (!admin) {
    admin = await User.create({
      name: 'Dr. V. Raman',
      email: 'admin@vynora.edu',
      passwordHash: User.hashPassword('AdminPass123!'),
      role: 'ADMIN',
      isVerified: true,
      avatarColor: '#153b33',
      academicProfile: {
        university: 'SR University',
        department: 'Academic Administration',
        degree: 'Faculty / Administration',
        year: 'Dean Office'
      },
      skills: ['Academic Administration', 'Governance', 'Campus Policy'],
      interest: 'Digital campus operational infrastructure',
      bio: 'Administrator for Vynora Campus platform and academic governance.'
    });
    console.info('[Seed] Initialized administrator profile (admin@vynora.edu).');
  }

  let aarav = await User.findOne({ email: 'aarav.mehta@sru.edu.in' });
  if (!aarav) {
    aarav = await User.create({
      name: 'Aarav Mehta',
      email: 'aarav.mehta@sru.edu.in',
      passwordHash: User.hashPassword('StudentPass123!'),
      role: 'STUDENT',
      isVerified: true,
      avatarColor: '#c3e1d2',
      academicProfile: {
        university: 'SR University',
        degree: 'B.Tech',
        program: 'CSE-AIML',
        year: 'Third',
        batch: '10',
        academicYear: '2026-27',
        department: 'Computer Science'
      },
      skills: ['React', 'TypeScript', 'Systems', 'Python'],
      interest: 'Building useful campus tools and system engineering',
      bio: 'CSE Third year student focusing on clean system architecture and distributed campus apps.'
    });
    console.info('[Seed] Created student Aarav Mehta (aarav.mehta@sru.edu.in)');
  }

  let nisha = await User.findOne({ email: 'nisha.raman@sru.edu.in' });
  if (!nisha) {
    nisha = await User.create({
      name: 'Nisha Raman',
      email: 'nisha.raman@sru.edu.in',
      passwordHash: User.hashPassword('StudentPass123!'),
      role: 'CLUB_HEAD',
      isVerified: true,
      avatarColor: '#e6c7a8',
      academicProfile: {
        university: 'SR University',
        degree: 'B.Des',
        program: 'Product Design',
        year: 'Second',
        batch: '02',
        academicYear: '2026-27',
        department: 'Design'
      },
      skills: ['Figma', 'Research', 'Brand', 'Design Systems'],
      interest: 'Designing for everyday friction and mobile interfaces',
      bio: 'Club Head of GDSC & Product Guild. Passionate about accessible user research.'
    });
    console.info('[Seed] Created Club Head Nisha Raman (nisha.raman@sru.edu.in)');
  }

  let kabir = await User.findOne({ email: 'kabir.shah@sru.edu.in' });
  if (!kabir) {
    kabir = await User.create({
      name: 'Kabir Shah',
      email: 'kabir.shah@sru.edu.in',
      passwordHash: User.hashPassword('StudentPass123!'),
      role: 'STUDENT',
      isVerified: true,
      avatarColor: '#c9d8f1',
      academicProfile: {
        university: 'SR University',
        degree: 'B.Tech',
        program: 'CSE-AIML',
        year: 'Third',
        batch: '10',
        academicYear: '2026-27',
        department: 'Computer Science'
      },
      skills: ['Python', 'ML', 'Data', 'PyTorch'],
      interest: 'Applied machine learning and NLP',
      bio: 'Machine learning practitioner working on attendance and schedule predictors.'
    });
  }

  let sana = await User.findOne({ email: 'sana.iqbal@sru.edu.in' });
  if (!sana) {
    sana = await User.create({
      name: 'Sana Iqbal',
      email: 'sana.iqbal@sru.edu.in',
      passwordHash: User.hashPassword('StudentPass123!'),
      role: 'STUDENT',
      isVerified: true,
      avatarColor: '#dfc6e6',
      academicProfile: {
        university: 'SR University',
        degree: 'B.Tech',
        program: 'ECE',
        year: 'Second',
        batch: '01',
        academicYear: '2026-27',
        department: 'Electronics'
      },
      skills: ['IoT', 'Arduino', 'UX', 'Embedded Systems'],
      interest: 'Tinkering with physical systems and room sensors',
      bio: 'Building sensor networks for study spaces across campus.'
    });
  }

  let faculty = await User.findOne({ email: 'dr.ramesh@sru.edu.in' });
  if (!faculty) {
    faculty = await User.create({
      name: 'Dr. Ramesh Babu A',
      email: 'dr.ramesh@sru.edu.in',
      passwordHash: User.hashPassword('FacultyPass123!'),
      role: 'FACULTY',
      isVerified: true,
      avatarColor: '#176b5a',
      academicProfile: {
        university: 'SR University',
        degree: 'Professor',
        program: 'CSE',
        year: 'Faculty',
        department: 'Computer Science'
      },
      skills: ['Algorithms', 'Data Structures', 'Formal Verification'],
      interest: 'Algorithm design and computational complexity',
      bio: 'Faculty Coordinator for CSE Third Year Academic Roster.'
    });
  }

  // 2. Seed Clubs
  const gdsc = await Club.findOneAndUpdate(
    { slug: 'gdsc' },
    {
      name: 'Google Developer Student Club',
      slug: 'gdsc',
      description: 'Community for student developers passionate about Google developer technologies and open source.',
      category: 'Coding & Technology',
      clubHeadId: nisha._id,
      facultyCoordinator: 'Dr. Ramesh Babu A',
      status: 'APPROVED',
      membersCount: 42
    },
    { upsert: true, new: true }
  );

  const robotics = await Club.findOneAndUpdate(
    { slug: 'robotics' },
    {
      name: 'Robotics & Hardware Guild',
      slug: 'robotics',
      description: 'Hands-on hardware lab for building autonomous robots, drones, and connected campus IoT systems.',
      category: 'Robotics',
      clubHeadId: sana._id,
      facultyCoordinator: 'Dr. G. Srinivas',
      status: 'APPROVED',
      membersCount: 28
    },
    { upsert: true, new: true }
  );

  const design = await Club.findOneAndUpdate(
    { slug: 'design-guild' },
    {
      name: 'Campus Product & Design Guild',
      slug: 'design-guild',
      description: 'A cross-discipline collective bringing UX research, Figma workshops, and human interface thinking.',
      category: 'Design',
      clubHeadId: nisha._id,
      facultyCoordinator: 'Prof. K. Venkatesh',
      status: 'APPROVED',
      membersCount: 35
    },
    { upsert: true, new: true }
  );

  // 3. Seed Announcements
  const countAnnouncements = await Announcement.countDocuments();
  if (countAnnouncements === 0) {
    await Announcement.insertMany([
      {
        title: 'SR University Mid-Semester Examination Schedule Published',
        body: 'The official schedule for Mid-Semester examinations (October 2026) is now published. Please review your respective batch course codes and report room conflicts immediately to the Controller of Examinations.',
        authorId: admin._id,
        authorName: 'Dr. V. Raman',
        category: 'IMPORTANT_NOTICE',
        priority: 'URGENT',
        isOfficial: true,
        status: 'PUBLISHED'
      },
      {
        title: 'GDSC Solution Challenge 2026: Team Formation & Ideation',
        body: 'Join us this Friday at 5:00 PM in the Central Library Pods for the Solution Challenge launch. Mentors will be available to help form interdisciplinary teams.',
        authorId: nisha._id,
        authorName: 'Nisha Raman',
        clubId: gdsc._id,
        clubName: gdsc.name,
        category: 'WORKSHOP',
        priority: 'HIGH',
        isOfficial: false,
        status: 'PUBLISHED'
      },
      {
        title: 'Quiet Hours Sensor Deployment Complete at CSE Block',
        body: 'Real-time occupancy sensors have been installed in CSE-214 and Library Pod 06. Check live seat availability directly in Vynora Campus Services.',
        authorId: sana._id,
        authorName: 'Sana Iqbal',
        clubId: robotics._id,
        clubName: robotics.name,
        category: 'OPPORTUNITY',
        priority: 'NORMAL',
        isOfficial: false,
        status: 'PUBLISHED'
      }
    ]);
    console.info('[Seed] Inserted initial official and club announcements.');
  }

  // 4. Seed Events
  const countEvents = await Event.countDocuments();
  if (countEvents === 0) {
    await Event.insertMany([
      {
        title: 'Human-centred AI Workshop',
        description: 'Hands-on practical exploration of building responsible, accessible AI user interfaces with modern LLM pipelines.',
        clubId: gdsc._id,
        clubName: gdsc.name,
        organizerId: nisha._id,
        venue: 'CSE Block · Lab 1205',
        startTime: new Date(Date.now() + 4 * 3600 * 1000),
        endTime: new Date(Date.now() + 6 * 3600 * 1000),
        maxCapacity: 60,
        registeredCount: 38,
        category: 'Workshop',
        code: 'HCAI',
        artClass: 'art0',
        status: 'PUBLISHED'
      },
      {
        title: 'Nexus Hackathon 2026',
        description: '48-hour student innovation sprint solving campus mobility, academic resource accessibility, and peer collaboration.',
        clubId: gdsc._id,
        clubName: gdsc.name,
        organizerId: nisha._id,
        venue: 'Student Activity Centre · Main Hall',
        startTime: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        endTime: new Date(Date.now() + 5 * 24 * 3600 * 1000),
        maxCapacity: 120,
        registeredCount: 84,
        category: 'Competition',
        code: 'NEXUS',
        artClass: 'art1',
        status: 'PUBLISHED'
      },
      {
        title: 'Google STEP Internship Briefing',
        description: 'Comprehensive breakdown of eligibility, technical interview preparation, and resume requirements for Google STEP 2026-27.',
        organizerId: admin._id,
        venue: 'Auditorium 2 & Online Stream',
        startTime: new Date(Date.now() + 4 * 24 * 3600 * 1000),
        endTime: new Date(Date.now() + 4 * 24 * 3600 * 1000 + 7200 * 1000),
        maxCapacity: 200,
        registeredCount: 142,
        category: 'Opportunity',
        code: 'STEP',
        artClass: 'art2',
        status: 'PUBLISHED'
      }
    ]);
    console.info('[Seed] Inserted initial campus events.');
  }

  // 5. Seed Projects
  const countProjects = await Project.countDocuments();
  if (countProjects === 0) {
    await Project.insertMany([
      {
        name: 'Orbit — Campus Mobility',
        about: 'A smarter way to share rides, find shuttle timings and report last-mile gaps across the campus perimeter.',
        ownerId: nisha._id,
        ownerName: 'Nisha Raman',
        skills: ['React', 'Figma', 'Maps', 'Geolocation'],
        membersCount: 3,
        maxMembers: 5,
        status: 'Building',
        recruiting: true,
        accent: '#e85d3f'
      },
      {
        name: 'Quiet Hours',
        about: 'Live room availability for focused study spaces across campus using lightweight IoT sensors and student validation.',
        ownerId: sana._id,
        ownerName: 'Sana Iqbal',
        skills: ['Python', 'IoT', 'UI/UX', 'FastAPI'],
        membersCount: 2,
        maxMembers: 4,
        status: 'Planning',
        recruiting: true,
        accent: '#176b5a'
      },
      {
        name: 'Papertrail',
        about: 'A focused, peer-reviewed archive for semester past papers, revision notes, and course study guides.',
        ownerId: aarav._id,
        ownerName: 'Aarav Mehta',
        skills: ['React', 'Content', 'TypeScript'],
        membersCount: 4,
        maxMembers: 4,
        status: 'Testing',
        recruiting: false,
        accent: '#3565b5'
      }
    ]);
    console.info('[Seed] Inserted initial student projects.');
  }

  // 6. Seed Community Posts
  const countPosts = await CommunityPost.countDocuments();
  if (countPosts === 0) {
    await CommunityPost.insertMany([
      {
        title: 'Need someone who knows Figma to help untangle our hackathon flow.',
        body: 'We have a working mobility prototype for Orbit, but our user journey is all over the place. Looking for a 30-minute critique today.',
        authorId: nisha._id,
        authorName: 'Nisha Raman',
        authorDept: 'Design',
        topic: 'Hackathons',
        category: 'HELP REQUEST · HACKATHON',
        skills: ['Figma', 'UX', 'Orbit'],
        featured: true,
        likesCount: 12,
        commentsCount: 3
      },
      {
        title: 'Anyone have a concise explanation for vector databases before tonight’s AI club session?',
        body: 'Looking for a resource or a quick primer on embeddings, cosine similarity, and FAISS indexing, not a full course.',
        authorId: kabir._id,
        authorName: 'Kabir Shah',
        authorDept: 'Computer Science',
        topic: 'Coding',
        category: 'STUDY QUERY',
        skills: ['Python', 'AI', 'Databases'],
        featured: false,
        likesCount: 8,
        commentsCount: 4
      },
      {
        title: 'Quiet Hours is looking for a backend teammate.',
        body: 'We’re mapping the quietest places to work with room sensors and student reports. Looking for someone with basic FastAPI or Node knowledge.',
        authorId: sana._id,
        authorName: 'Sana Iqbal',
        authorDept: 'Electronics',
        topic: 'Projects',
        category: 'TEAM ROLE',
        skills: ['Python', 'IoT', 'FastAPI'],
        featured: false,
        likesCount: 15,
        commentsCount: 2
      }
    ]);
    console.info('[Seed] Inserted initial community posts.');
  }

  // 7. Seed Campus Services
  const countServices = await CampusService.countDocuments();
  if (countServices === 0) {
    await CampusService.insertMany([
      { name: 'CSE-214', category: 'ROOM', building: 'Building 1', floor: '2nd Floor', seats: '18 seats', avail: 'Available for 90+ minutes', status: 'green', contact: 'Lab In-Charge: Ext 214' },
      { name: 'Library Pod 06', category: 'ROOM', building: 'Central Library', floor: '1st Floor', seats: '6 seats', avail: 'Available for 90+ minutes', status: 'green', contact: 'Library Desk' },
      { name: 'Design Lab 03', category: 'LAB', building: 'Design Wing', floor: 'Ground Floor', seats: '24 seats', avail: 'Available until 16:10', status: 'orange', contact: 'Design Studio Lead' },
      { name: 'Seminar Hall 02', category: 'FACILITY', building: 'Block 2', floor: '3rd Floor', seats: '50 seats', avail: 'Available for 60 minutes', status: 'green', contact: 'Admin Block' }
    ]);
    console.info('[Seed] Inserted campus rooms and facilities.');
  }

  // 8. Seed Resources
  const countResources = await Resource.countDocuments();
  if (countResources === 0) {
    await Resource.insertMany([
      { title: 'DBMS: Query patterns that actually come up', subject: 'Database Systems', format: 'Notes', authorId: aarav._id, authorName: 'Aarav Mehta' },
      { title: 'Operating systems — past papers 2022–25', subject: 'Operating Systems', format: 'PDF', authorId: nisha._id, authorName: 'Nisha Raman' },
      { title: 'Figma handoff checklist for developers', subject: 'Product Studio', format: 'Guide', authorId: kabir._id, authorName: 'Kabir Shah' },
      { title: 'Computer networks lab walkthrough', subject: 'Networks', format: 'Lab material', authorId: sana._id, authorName: 'Sana Iqbal' },
      { title: 'Deep Learning & Neural Nets Lab Manual', subject: 'AI & Machine Learning', format: 'PDF', authorId: aarav._id, authorName: 'Aarav Mehta' }
    ]);
    console.info('[Seed] Inserted study resources.');
  }

  // 9. Seed Products (Including VYNORA PULSE)
  const countProducts = await Product.countDocuments();
  if (countProducts === 0) {
    await Product.insertMany([
      {
        name: 'Vynora Pulse | Never Miss What Changes Your Future',
        slug: 'vynora-pulse',
        tagline: 'Never Miss What Changes Your Future',
        description:
          'An email alert automation built for students and college officials. Vynora Pulse helps users identify important emails and receive useful alerts through their WhatsApp number, so important opportunities and updates are less likely to be missed.',
        features: [
          'Email alert automation for urgent campus notices',
          'Direct WhatsApp alerts for important deadlines & internships',
          'Zero inbox clutter — filter noise automatically',
          'Configured for student emails & university portal alerts'
        ],
        price: 0,
        currency: 'INR',
        billingInterval: 'ONE_TIME',
        isFree: true,
        isExternal: true,
        externalUrl: 'https://vynorapulse.vercel.app/',
        badge: 'EXTERNAL PRODUCT',
        status: 'ACTIVE'
      },
      {
        name: 'Campus Studio Pro',
        slug: 'campus-studio-pro',
        tagline: 'The complete productivity suite for student builders',
        description:
          'Unlock unlimited team repositories, prioritized project recruitment across campus, and automated mentor matching for hackathon teams.',
        features: [
          'Unlimited team project workspaces',
          'Priority ranking in campus project discovery',
          'Direct collaboration channel with verified student leads',
          'Exportable portfolio certificate of verified contributions'
        ],
        price: 199,
        currency: 'INR',
        billingInterval: 'MONTHLY',
        isFree: false,
        isExternal: false,
        badge: 'STUDENT PRO',
        status: 'ACTIVE'
      },
      {
        name: 'Semester Revision Vault',
        slug: 'semester-revision-vault',
        tagline: 'Verified past papers and faculty revision notes',
        description:
          'Comprehensive curated archive of 5-year question papers, high-scoring answer keys, and lab manuals verified by SR University faculty.',
        features: [
          '5-year question bank with verified step-by-step solutions',
          'Subject mind maps and cheatsheets',
          'Downloadable offline PDF archives',
          'Updated every academic semester'
        ],
        price: 99,
        currency: 'INR',
        billingInterval: 'ONE_TIME',
        isFree: false,
        isExternal: false,
        badge: 'EXAM PREP',
        status: 'ACTIVE'
      }
    ]);
    console.info('[Seed] Inserted Vynora product catalog including Vynora Pulse.');
  }

  // 10. Seed Timetable from local cache
  const countTimetables = await Timetable.countDocuments();
  if (countTimetables === 0) {
    try {
      const cachePath = join(process.cwd(), 'server', 'data', 'timetable-cache.json');
      const cacheData = JSON.parse(await readFile(cachePath, 'utf8'));

      if (cacheData['24BTCAIAIB10:Third']) {
        const b10 = cacheData['24BTCAIAIB10:Third'];
        await Timetable.create({
          degree: 'B.Tech',
          program: 'CSE-AIML',
          year: 'Third',
          batch: '10',
          sruBatchCode: '24BTCAIAIB10',
          academicSession: '2026-27',
          entries: b10.entries,
          source: 'SR University Academic Schedule (Verified)'
        });
      }

      if (cacheData['24BTCAIAIB09:Third']) {
        const b09 = cacheData['24BTCAIAIB09:Third'];
        await Timetable.create({
          degree: 'B.Tech',
          program: 'CSE-AIML',
          year: 'Third',
          batch: '09',
          sruBatchCode: '24BTCAIAIB09',
          academicSession: '2026-27',
          entries: b09.entries,
          source: 'SR University Academic Schedule (Verified)'
        });
      }

      if (cacheData['24BTCSCSB01:Third']) {
        const bCse = cacheData['24BTCSCSB01:Third'];
        await Timetable.create({
          degree: 'B.Tech',
          program: 'CSE',
          year: 'Third',
          batch: '01',
          sruBatchCode: '24BTCSCSB01',
          academicSession: '2026-27',
          entries: bCse.entries,
          source: 'SR University Academic Schedule (Verified)'
        });
      }
      console.info('[Seed] Populated verified SRU timetables into MongoDB.');
    } catch (e) {
      console.warn('[Seed] Timetable cache file import note:', e.message);
    }
  }

  // 11. Notifications initialized clean without mock notices

  console.info('[Seed] Seed script finished successfully!');
}
