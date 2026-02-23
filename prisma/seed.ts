import { Day, PrismaClient, UserSex } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // ADMIN
  await prisma.admin.create({
    data: {
      id: "admin1",
      username: "admin1",
    },
  });
  await prisma.admin.create({
    data: {
      id: "admin2",
      username: "admin2",
    },
  });

  // GRADE
  for (let i = 1; i <= 6; i++) {
    await prisma.grade.create({
      data: {
        level: i,
      },
    });
  }

  // CLASS
  for (let i = 1; i <= 6; i++) {
    await prisma.class.create({
      data: {
        name: `${i}A`, 
        gradeId: i, 
        capacity: Math.floor(Math.random() * (20 - 15 + 1)) + 15,
      },
    });
  }

  // SUBJECT
  const subjectData = [
    { name: "Mathematics" },
    { name: "Science" },
    { name: "English" },
    { name: "History" },
    { name: "Geography" },
    { name: "Physics" },
    { name: "Chemistry" },
    { name: "Biology" },
    { name: "Computer Science" },
    { name: "Art" },
  ];

  for (const subject of subjectData) {
    await prisma.subject.create({ data: subject });
  }

  // TEACHER
  for (let i = 1; i <= 15; i++) {
    await prisma.teacher.create({
      data: {
        id: `teacher${i}`, // Unique ID for the teacher
        username: `teacher${i}`,
        name: `TName${i}`,
        surname: `TSurname${i}`,
        email: `teacher${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
        bloodType: "A+",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        subjects: { connect: [{ id: (i % 10) + 1 }] }, 
        classes: { connect: [{ id: (i % 6) + 1 }] }, 
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 30)),
      },
    });
  }

  // LESSON
  for (let i = 1; i <= 30; i++) {
    await prisma.lesson.create({
      data: {
        name: `Lesson${i}`, 
        day: Day[
          Object.keys(Day)[
            Math.floor(Math.random() * Object.keys(Day).length)
          ] as keyof typeof Day
        ], 
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)), 
        endTime: new Date(new Date().setHours(new Date().getHours() + 3)), 
        subjectId: (i % 10) + 1, 
        classId: (i % 6) + 1, 
        teacherId: `teacher${(i % 15) + 1}`, 
      },
    });
  }

  // PARENT
  for (let i = 1; i <= 25; i++) {
    await prisma.parent.create({
      data: {
        id: `parentId${i}`,
        username: `parentId${i}`,
        name: `PName ${i}`,
        surname: `PSurname ${i}`,
        email: `parent${i}@example.com`,
        phone: `123-456-789${i}`,
        address: `Address${i}`,
      },
    });
  }

  // STUDENT
  for (let i = 1; i <= 50; i++) {
    await prisma.student.create({
      data: {
        id: `student${i}`, 
        username: `student${i}`, 
        name: `SName${i}`,
        surname: `SSurname ${i}`,
        email: `student${i}@example.com`,
        phone: `987-654-321${i}`,
        address: `Address${i}`,
        bloodType: "O-",
        sex: i % 2 === 0 ? UserSex.MALE : UserSex.FEMALE,
        parentId: `parentId${Math.ceil(i / 2) % 25 || 25}`, 
        gradeId: (i % 6) + 1, 
        classId: (i % 6) + 1, 
        birthday: new Date(new Date().setFullYear(new Date().getFullYear() - 10)),
      },
    });
  }

  // EXAM
  for (let i = 1; i <= 10; i++) {
    await prisma.exam.create({
      data: {
        title: `Exam ${i}`, 
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)), 
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)), 
        lessonId: (i % 30) + 1, 
      },
    });
  }

  // ASSIGNMENT
  for (let i = 1; i <= 10; i++) {
    await prisma.assignment.create({
      data: {
        title: `Assignment ${i}`, 
        startDate: new Date(new Date().setHours(new Date().getHours() + 1)), 
        dueDate: new Date(new Date().setDate(new Date().getDate() + 1)), 
        lessonId: (i % 30) + 1, 
      },
    });
  }

  // RESULT
  for (let i = 1; i <= 10; i++) {
    await prisma.result.create({
      data: {
        score: 90, 
        studentId: `student${i}`, 
        ...(i <= 5 ? { examId: i } : { assignmentId: i - 5 }), 
      },
    });
  }

  // ATTENDANCE
  for (let i = 1; i <= 10; i++) {
    await prisma.attendance.create({
      data: {
        date: new Date(), 
        present: true, 
        studentId: `student${i}`, 
        lessonId: (i % 30) + 1, 
      },
    });
  }

  // EVENT
  for (let i = 1; i <= 5; i++) {
    await prisma.event.create({
      data: {
        title: `Event ${i}`, 
        description: `Description for Event ${i}`, 
        startTime: new Date(new Date().setHours(new Date().getHours() + 1)), 
        endTime: new Date(new Date().setHours(new Date().getHours() + 2)), 
        classId: (i % 5) + 1, 
      },
    });
  }

  // ANNOUNCEMENT
  for (let i = 1; i <= 5; i++) {
    await prisma.announcement.create({
      data: {
        title: `Announcement ${i}`, 
        description: `Description for Announcement ${i}`, 
        date: new Date(), 
        classId: (i % 5) + 1, 
      },
    });
  }

  // BADGES (gamification)
  const badges = [
    {
      name: "First Steps",
      category: "course",
      description: "Complete your first lesson",
      threshold: 1,
      xpReward: 10,
      criteria: JSON.stringify({ type: "lesson_count", count: 1 }),
    },
    {
      name: "Quiz Taker",
      category: "quiz",
      description: "Complete your first quiz",
      threshold: 1,
      xpReward: 10,
      criteria: JSON.stringify({ type: "quiz_count", count: 1 }),
    },
    {
      name: "Perfect Score",
      category: "quiz",
      description: "Score 100% on any quiz",
      threshold: 100,
      xpReward: 25,
      criteria: JSON.stringify({ type: "quiz_perfect", percentage: 100 }),
    },
    {
      name: "Consistent",
      category: "streak",
      description: "Achieve a 3-day streak",
      threshold: 3,
      xpReward: 15,
      criteria: JSON.stringify({ type: "streak", days: 3 }),
    },
    {
      name: "Dedicated",
      category: "streak",
      description: "Achieve a 7-day streak",
      threshold: 7,
      xpReward: 30,
      criteria: JSON.stringify({ type: "streak", days: 7 }),
    },
    {
      name: "Marathon",
      category: "streak",
      description: "Achieve a 14-day streak",
      threshold: 14,
      xpReward: 75,
      criteria: JSON.stringify({ type: "streak", days: 14 }),
    },
    {
      name: "Scholar",
      category: "course",
      description: "Complete your first course",
      threshold: 1,
      xpReward: 50,
      criteria: JSON.stringify({ type: "course_complete", count: 1 }),
    },
    {
      name: "Bookworm",
      category: "course",
      description: "Complete 3 courses",
      threshold: 3,
      xpReward: 100,
      criteria: JSON.stringify({ type: "course_complete", count: 3 }),
    },
    {
      name: "Century",
      category: "xp",
      description: "Earn 100 total XP",
      threshold: 100,
      xpReward: 20,
      criteria: JSON.stringify({ type: "total_xp", amount: 100 }),
    },
    {
      name: "XP Master",
      category: "xp",
      description: "Earn 1000 total XP",
      threshold: 1000,
      xpReward: 50,
      criteria: JSON.stringify({ type: "total_xp", amount: 1000 }),
    },
    {
      name: "First Review",
      category: "review",
      description: "Complete your first review session",
      threshold: 1,
      xpReward: 10,
      criteria: JSON.stringify({ type: "review_session_count", count: 1 }),
    },
    {
      name: "Review Streak 4",
      category: "review_streak",
      description: "Complete reviews for 4 consecutive weekends",
      threshold: 4,
      xpReward: 30,
      criteria: JSON.stringify({ type: "review_streak", weekends: 4 }),
    },
    {
      name: "Master 50 Cards",
      category: "mastery",
      description: "Move 50 cards to mastery level (Box 5)",
      threshold: 50,
      xpReward: 100,
      criteria: JSON.stringify({ type: "mastery_count", count: 50 }),
    },
    {
      name: "Perfect Session",
      category: "review_perfect",
      description: "Complete a review session with all cards correct",
      threshold: 1,
      xpReward: 25,
      criteria: JSON.stringify({ type: "review_perfect_session", count: 1 }),
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: {},
      create: badge,
    });
  }

  // GUIDE CATEGORIES AND GUIDES (SPEC-GUIDE-001)
  const gettingStarted = await prisma.guideCategory.create({
    data: { slug: "getting-started", nameEn: "Getting Started", nameMs: "Mula Di Sini", order: 1 },
  });
  const schoolManagement = await prisma.guideCategory.create({
    data: { slug: "school-management", nameEn: "School Management", nameMs: "Pengurusan Sekolah", order: 2 },
  });
  const lmsCourses = await prisma.guideCategory.create({
    data: { slug: "lms-courses", nameEn: "LMS & Courses", nameMs: "LMS & Kursus", order: 3 },
  });
  const assessmentsQuizzes = await prisma.guideCategory.create({
    data: { slug: "assessments-quizzes", nameEn: "Assessments & Quizzes", nameMs: "Penilaian & Kuiz", order: 4 },
  });
  const forParents = await prisma.guideCategory.create({
    data: { slug: "for-parents", nameEn: "For Parents", nameMs: "Untuk Ibu Bapa", order: 5 },
  });

  // Getting Started guides (all roles)
  const gettingStartedGuides = [
    {
      slug: "welcome-to-the-platform",
      categoryId: gettingStarted.id,
      roleAccess: ["admin", "teacher", "student", "parent"],
      isPublished: true,
      order: 1,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Welcome to the Platform",
            excerpt: "Learn the basics of navigating the school management system.",
            content: "# Welcome to the Platform\n\nThis guide will help you get started with the school management system.\n\n## First Steps\n\n1. Log in with your credentials\n2. Explore the dashboard\n3. Update your profile\n\n## Need Help?\n\nContact your school administrator for assistance.",
          },
          {
            locale: "ms",
            title: "Selamat Datang ke Platform",
            excerpt: "Pelajari asas navigasi sistem pengurusan sekolah.",
            content: "# Selamat Datang ke Platform\n\nPanduan ini akan membantu anda bermula dengan sistem pengurusan sekolah.\n\n## Langkah Pertama\n\n1. Log masuk dengan kelayakan anda\n2. Terokai papan pemuka\n3. Kemaskini profil anda\n\n## Perlukan Bantuan?\n\nHubungi pentadbir sekolah anda untuk bantuan.",
          },
        ],
      },
    },
    {
      slug: "understanding-your-dashboard",
      categoryId: gettingStarted.id,
      roleAccess: ["admin", "teacher", "student", "parent"],
      isPublished: true,
      order: 2,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Understanding Your Dashboard",
            excerpt: "A complete guide to the dashboard widgets and navigation.",
            content: "# Understanding Your Dashboard\n\nYour dashboard is the central hub for all activities.\n\n## Key Widgets\n\n- **Calendar**: View upcoming events and deadlines\n- **Announcements**: Stay updated with school news\n- **Quick Links**: Access frequently used features\n\n## Customization\n\nYou can rearrange widgets by dragging them to your preferred position.",
          },
          {
            locale: "ms",
            title: "Memahami Papan Pemuka Anda",
            excerpt: "Panduan lengkap tentang widget papan pemuka dan navigasi.",
            content: "# Memahami Papan Pemuka Anda\n\nPapan pemuka anda adalah hab pusat untuk semua aktiviti.\n\n## Widget Utama\n\n- **Kalendar**: Lihat acara dan tarikh akhir yang akan datang\n- **Pengumuman**: Kekal dikemaskini dengan berita sekolah\n- **Pautan Pantas**: Akses ciri yang kerap digunakan\n\n## Penyesuaian\n\nAnda boleh menyusun semula widget dengan menyeretnya ke kedudukan pilihan anda.",
          },
        ],
      },
    },
    {
      slug: "setting-up-your-profile",
      categoryId: gettingStarted.id,
      roleAccess: ["admin", "teacher", "student", "parent"],
      isPublished: true,
      order: 3,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Setting Up Your Profile",
            excerpt: "How to complete and customize your user profile.",
            content: "# Setting Up Your Profile\n\nA complete profile helps others identify you and improves communication.\n\n## Required Information\n\n- Full name\n- Contact email\n- Phone number\n\n## Optional Settings\n\n- Profile picture\n- Notification preferences\n- Language preference",
          },
          {
            locale: "ms",
            title: "Menyediakan Profil Anda",
            excerpt: "Cara melengkapkan dan menyesuaikan profil pengguna anda.",
            content: "# Menyediakan Profil Anda\n\nProfil yang lengkap membantu orang lain mengenali anda dan meningkatkan komunikasi.\n\n## Maklumat Diperlukan\n\n- Nama penuh\n- E-mel hubungan\n- Nombor telefon\n\n## Tetapan Pilihan\n\n- Gambar profil\n- Keutamaan pemberitahuan\n- Keutamaan bahasa",
          },
        ],
      },
    },
  ];

  for (const guide of gettingStartedGuides) {
    await prisma.guide.create({ data: guide });
  }

  // School Management guides (admin, teacher)
  const schoolManagementGuides = [
    {
      slug: "managing-classes-and-schedules",
      categoryId: schoolManagement.id,
      roleAccess: ["admin", "teacher"],
      isPublished: true,
      order: 1,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Managing Classes and Schedules",
            excerpt: "Learn how to create, edit, and manage class schedules.",
            content: "# Managing Classes and Schedules\n\nEfficient schedule management is key to smooth school operations.\n\n## Creating a Class\n\n1. Navigate to **Classes** in the sidebar\n2. Click **Add New Class**\n3. Fill in class details and assign a teacher\n\n## Schedule Management\n\n- Set lesson times for each day\n- Assign subjects to time slots\n- Handle schedule conflicts automatically",
          },
          {
            locale: "ms",
            title: "Mengurus Kelas dan Jadual",
            excerpt: "Pelajari cara membuat, mengedit, dan mengurus jadual kelas.",
            content: "# Mengurus Kelas dan Jadual\n\nPengurusan jadual yang cekap adalah kunci operasi sekolah yang lancar.\n\n## Membuat Kelas\n\n1. Navigasi ke **Kelas** di bar sisi\n2. Klik **Tambah Kelas Baharu**\n3. Isi butiran kelas dan tugaskan guru\n\n## Pengurusan Jadual\n\n- Tetapkan masa pelajaran untuk setiap hari\n- Tugaskan mata pelajaran ke slot masa\n- Tangani konflik jadual secara automatik",
          },
        ],
      },
    },
    {
      slug: "student-enrollment-process",
      categoryId: schoolManagement.id,
      roleAccess: ["admin", "teacher"],
      isPublished: true,
      order: 2,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Student Enrollment Process",
            excerpt: "Step-by-step guide for enrolling new students.",
            content: "# Student Enrollment Process\n\nThis guide covers the complete enrollment workflow.\n\n## Steps\n\n1. Collect student information\n2. Assign to a grade and class\n3. Link parent accounts\n4. Set up initial subjects\n\n## Bulk Enrollment\n\nFor multiple students, use the CSV import feature under **Settings > Import Data**.",
          },
          {
            locale: "ms",
            title: "Proses Pendaftaran Pelajar",
            excerpt: "Panduan langkah demi langkah untuk mendaftarkan pelajar baharu.",
            content: "# Proses Pendaftaran Pelajar\n\nPanduan ini merangkumi aliran kerja pendaftaran lengkap.\n\n## Langkah-langkah\n\n1. Kumpul maklumat pelajar\n2. Tugaskan ke gred dan kelas\n3. Hubungkan akaun ibu bapa\n4. Sediakan mata pelajaran awal\n\n## Pendaftaran Pukal\n\nUntuk berbilang pelajar, gunakan ciri import CSV di bawah **Tetapan > Import Data**.",
          },
        ],
      },
    },
    {
      slug: "attendance-tracking-guide",
      categoryId: schoolManagement.id,
      roleAccess: ["admin", "teacher"],
      isPublished: true,
      order: 3,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Attendance Tracking Guide",
            excerpt: "How to record and monitor student attendance effectively.",
            content: "# Attendance Tracking Guide\n\nAccurate attendance records are essential for student monitoring.\n\n## Daily Attendance\n\n1. Open the lesson from your schedule\n2. Mark students as present or absent\n3. Save the attendance record\n\n## Reports\n\n- View attendance trends per student\n- Generate monthly attendance reports\n- Set up absence alerts for parents",
          },
          {
            locale: "ms",
            title: "Panduan Penjejakan Kehadiran",
            excerpt: "Cara merekod dan memantau kehadiran pelajar dengan berkesan.",
            content: "# Panduan Penjejakan Kehadiran\n\nRekod kehadiran yang tepat adalah penting untuk pemantauan pelajar.\n\n## Kehadiran Harian\n\n1. Buka pelajaran dari jadual anda\n2. Tandakan pelajar sebagai hadir atau tidak hadir\n3. Simpan rekod kehadiran\n\n## Laporan\n\n- Lihat trend kehadiran setiap pelajar\n- Jana laporan kehadiran bulanan\n- Sediakan makluman ketidakhadiran untuk ibu bapa",
          },
        ],
      },
    },
  ];

  for (const guide of schoolManagementGuides) {
    await prisma.guide.create({ data: guide });
  }

  // LMS & Courses guides (admin, teacher, student)
  const lmsCoursesGuides = [
    {
      slug: "creating-a-course",
      categoryId: lmsCourses.id,
      roleAccess: ["admin", "teacher", "student"],
      isPublished: true,
      order: 1,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Creating a Course",
            excerpt: "How teachers can create and structure courses in the LMS.",
            content: "# Creating a Course\n\nCourses are the backbone of the learning management system.\n\n## Course Setup\n\n1. Go to **Courses > Create New**\n2. Enter course title and description\n3. Add modules and lessons\n4. Upload learning materials\n\n## Best Practices\n\n- Keep modules focused on one topic\n- Include a mix of content types\n- Set clear learning objectives",
          },
          {
            locale: "ms",
            title: "Membuat Kursus",
            excerpt: "Cara guru boleh membuat dan menyusun kursus dalam LMS.",
            content: "# Membuat Kursus\n\nKursus adalah tulang belakang sistem pengurusan pembelajaran.\n\n## Penyediaan Kursus\n\n1. Pergi ke **Kursus > Buat Baharu**\n2. Masukkan tajuk dan penerangan kursus\n3. Tambah modul dan pelajaran\n4. Muat naik bahan pembelajaran\n\n## Amalan Terbaik\n\n- Pastikan modul fokus pada satu topik\n- Sertakan gabungan jenis kandungan\n- Tetapkan objektif pembelajaran yang jelas",
          },
        ],
      },
    },
    {
      slug: "enrolling-in-courses",
      categoryId: lmsCourses.id,
      roleAccess: ["admin", "teacher", "student"],
      isPublished: true,
      order: 2,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Enrolling in Courses",
            excerpt: "How students can browse and enroll in available courses.",
            content: "# Enrolling in Courses\n\nDiscover and join courses that match your learning goals.\n\n## Finding Courses\n\n1. Visit the **Course Catalog**\n2. Browse by subject or search by keyword\n3. Review the course description and syllabus\n\n## Enrollment\n\n- Click **Enroll** on the course page\n- Some courses may require teacher approval\n- Track your enrolled courses on the dashboard",
          },
          {
            locale: "ms",
            title: "Mendaftar dalam Kursus",
            excerpt: "Cara pelajar boleh melayari dan mendaftar dalam kursus yang tersedia.",
            content: "# Mendaftar dalam Kursus\n\nTemui dan sertai kursus yang sepadan dengan matlamat pembelajaran anda.\n\n## Mencari Kursus\n\n1. Lawati **Katalog Kursus**\n2. Layari mengikut mata pelajaran atau cari mengikut kata kunci\n3. Semak penerangan kursus dan silibus\n\n## Pendaftaran\n\n- Klik **Daftar** di halaman kursus\n- Sesetengah kursus mungkin memerlukan kelulusan guru\n- Jejaki kursus yang didaftarkan di papan pemuka",
          },
        ],
      },
    },
    {
      slug: "tracking-lesson-progress",
      categoryId: lmsCourses.id,
      roleAccess: ["admin", "teacher", "student"],
      isPublished: true,
      order: 3,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Tracking Lesson Progress",
            excerpt: "Monitor your progress through course lessons and modules.",
            content: "# Tracking Lesson Progress\n\nStay on top of your learning journey with progress tracking.\n\n## Progress Indicators\n\n- **Green**: Completed lessons\n- **Yellow**: In-progress lessons\n- **Gray**: Not started\n\n## Completion Requirements\n\n- Watch or read all lesson content\n- Complete any embedded activities\n- Pass the lesson quiz (if applicable)",
          },
          {
            locale: "ms",
            title: "Menjejak Kemajuan Pelajaran",
            excerpt: "Pantau kemajuan anda melalui pelajaran dan modul kursus.",
            content: "# Menjejak Kemajuan Pelajaran\n\nKekal di atas perjalanan pembelajaran anda dengan penjejakan kemajuan.\n\n## Penunjuk Kemajuan\n\n- **Hijau**: Pelajaran selesai\n- **Kuning**: Pelajaran sedang berjalan\n- **Kelabu**: Belum dimulakan\n\n## Keperluan Penyelesaian\n\n- Tonton atau baca semua kandungan pelajaran\n- Selesaikan sebarang aktiviti terbenam\n- Lulus kuiz pelajaran (jika berkenaan)",
          },
        ],
      },
    },
  ];

  for (const guide of lmsCoursesGuides) {
    await prisma.guide.create({ data: guide });
  }

  // Assessments & Quizzes guides (admin, teacher, student, parent)
  const assessmentsQuizzesGuides = [
    {
      slug: "creating-quizzes-and-exams",
      categoryId: assessmentsQuizzes.id,
      roleAccess: ["admin", "teacher", "student", "parent"],
      isPublished: true,
      order: 1,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Creating Quizzes and Exams",
            excerpt: "A guide for teachers on creating effective assessments.",
            content: "# Creating Quizzes and Exams\n\nWell-designed assessments help measure student understanding.\n\n## Question Types\n\n- **Multiple Choice**: Best for factual recall\n- **True/False**: Quick knowledge checks\n- **Short Answer**: Tests deeper understanding\n\n## Settings\n\n- Set time limits and attempt counts\n- Configure auto-grading options\n- Schedule exam availability windows",
          },
          {
            locale: "ms",
            title: "Membuat Kuiz dan Peperiksaan",
            excerpt: "Panduan untuk guru tentang membuat penilaian yang berkesan.",
            content: "# Membuat Kuiz dan Peperiksaan\n\nPenilaian yang direka dengan baik membantu mengukur pemahaman pelajar.\n\n## Jenis Soalan\n\n- **Pilihan Berganda**: Terbaik untuk ingatan fakta\n- **Betul/Salah**: Semakan pengetahuan pantas\n- **Jawapan Pendek**: Menguji pemahaman yang lebih mendalam\n\n## Tetapan\n\n- Tetapkan had masa dan bilangan percubaan\n- Konfigurasi pilihan gred automatik\n- Jadualkan tetingkap ketersediaan peperiksaan",
          },
        ],
      },
    },
    {
      slug: "taking-a-quiz",
      categoryId: assessmentsQuizzes.id,
      roleAccess: ["admin", "teacher", "student", "parent"],
      isPublished: true,
      order: 2,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Taking a Quiz",
            excerpt: "What students need to know before and during a quiz.",
            content: "# Taking a Quiz\n\nBe prepared and perform your best on quizzes.\n\n## Before the Quiz\n\n- Review the related lesson materials\n- Check the time limit and number of questions\n- Ensure a stable internet connection\n\n## During the Quiz\n\n- Read each question carefully\n- Manage your time wisely\n- You can flag questions to review later\n\n## After Submission\n\n- View your score immediately (if auto-graded)\n- Review correct answers when available",
          },
          {
            locale: "ms",
            title: "Mengambil Kuiz",
            excerpt: "Apa yang pelajar perlu tahu sebelum dan semasa kuiz.",
            content: "# Mengambil Kuiz\n\nBersedia dan berikan yang terbaik dalam kuiz.\n\n## Sebelum Kuiz\n\n- Semak bahan pelajaran yang berkaitan\n- Periksa had masa dan bilangan soalan\n- Pastikan sambungan internet yang stabil\n\n## Semasa Kuiz\n\n- Baca setiap soalan dengan teliti\n- Urus masa anda dengan bijak\n- Anda boleh tandakan soalan untuk disemak kemudian\n\n## Selepas Penghantaran\n\n- Lihat markah anda serta-merta (jika gred automatik)\n- Semak jawapan yang betul apabila tersedia",
          },
        ],
      },
    },
    {
      slug: "understanding-grades-and-results",
      categoryId: assessmentsQuizzes.id,
      roleAccess: ["admin", "teacher", "student", "parent"],
      isPublished: true,
      order: 3,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Understanding Grades and Results",
            excerpt: "How to interpret assessment scores and grade reports.",
            content: "# Understanding Grades and Results\n\nGrades reflect your performance across assessments.\n\n## Grade Breakdown\n\n- **Quizzes**: Contribute to formative assessment\n- **Exams**: Count toward summative assessment\n- **Assignments**: Factor into overall grade\n\n## Viewing Results\n\n1. Go to **My Results** from the dashboard\n2. Filter by subject or date range\n3. Click on any result for detailed feedback",
          },
          {
            locale: "ms",
            title: "Memahami Gred dan Keputusan",
            excerpt: "Cara mentafsir markah penilaian dan laporan gred.",
            content: "# Memahami Gred dan Keputusan\n\nGred mencerminkan prestasi anda merentas penilaian.\n\n## Pecahan Gred\n\n- **Kuiz**: Menyumbang kepada penilaian formatif\n- **Peperiksaan**: Dikira dalam penilaian sumatif\n- **Tugasan**: Faktor dalam gred keseluruhan\n\n## Melihat Keputusan\n\n1. Pergi ke **Keputusan Saya** dari papan pemuka\n2. Tapis mengikut mata pelajaran atau julat tarikh\n3. Klik pada mana-mana keputusan untuk maklum balas terperinci",
          },
        ],
      },
    },
  ];

  for (const guide of assessmentsQuizzesGuides) {
    await prisma.guide.create({ data: guide });
  }

  // For Parents guides (admin, parent)
  const forParentsGuides = [
    {
      slug: "monitoring-your-childs-progress",
      categoryId: forParents.id,
      roleAccess: ["admin", "parent"],
      isPublished: true,
      order: 1,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Monitoring Your Child's Progress",
            excerpt: "How parents can track academic performance and attendance.",
            content: "# Monitoring Your Child's Progress\n\nStay informed about your child's academic journey.\n\n## Dashboard Overview\n\n- View attendance records\n- Check recent quiz and exam scores\n- See upcoming assignments and deadlines\n\n## Notifications\n\n- Receive alerts for missed attendance\n- Get notified about new grades\n- Stay updated on school announcements",
          },
          {
            locale: "ms",
            title: "Memantau Kemajuan Anak Anda",
            excerpt: "Cara ibu bapa boleh menjejak prestasi akademik dan kehadiran.",
            content: "# Memantau Kemajuan Anak Anda\n\nKekal dimaklumkan tentang perjalanan akademik anak anda.\n\n## Gambaran Keseluruhan Papan Pemuka\n\n- Lihat rekod kehadiran\n- Semak markah kuiz dan peperiksaan terkini\n- Lihat tugasan dan tarikh akhir yang akan datang\n\n## Pemberitahuan\n\n- Terima makluman untuk kehadiran yang terlepas\n- Dapat pemberitahuan tentang gred baharu\n- Kekal dikemaskini dengan pengumuman sekolah",
          },
        ],
      },
    },
    {
      slug: "communicating-with-teachers",
      categoryId: forParents.id,
      roleAccess: ["admin", "parent"],
      isPublished: true,
      order: 2,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Communicating with Teachers",
            excerpt: "How to reach out to teachers and stay connected with school.",
            content: "# Communicating with Teachers\n\nEffective communication supports your child's education.\n\n## Contact Options\n\n- **Announcements**: View class announcements\n- **Events**: Attend school events and meetings\n- **Forums**: Participate in course discussion forums\n\n## Tips\n\n- Check announcements regularly\n- Attend parent-teacher conferences\n- Use the platform for all school-related communication",
          },
          {
            locale: "ms",
            title: "Berkomunikasi dengan Guru",
            excerpt: "Cara menghubungi guru dan kekal berhubung dengan sekolah.",
            content: "# Berkomunikasi dengan Guru\n\nKomunikasi yang berkesan menyokong pendidikan anak anda.\n\n## Pilihan Hubungan\n\n- **Pengumuman**: Lihat pengumuman kelas\n- **Acara**: Hadiri acara dan mesyuarat sekolah\n- **Forum**: Sertai forum perbincangan kursus\n\n## Tips\n\n- Semak pengumuman secara berkala\n- Hadiri persidangan ibu bapa-guru\n- Gunakan platform untuk semua komunikasi berkaitan sekolah",
          },
        ],
      },
    },
    {
      slug: "supporting-learning-at-home",
      categoryId: forParents.id,
      roleAccess: ["admin", "parent"],
      isPublished: true,
      order: 3,
      authorId: "admin1",
      authorRole: "admin",
      translations: {
        create: [
          {
            locale: "en",
            title: "Supporting Learning at Home",
            excerpt: "Tips and tools for parents to support their child's studies.",
            content: "# Supporting Learning at Home\n\nYour involvement makes a big difference in your child's education.\n\n## Review Sessions\n\n- Help your child with spaced repetition review cards\n- Monitor the parent review dashboard\n- Encourage consistent study habits\n\n## Resources\n\n- Access course materials shared by teachers\n- Use the platform's recommended learning resources\n- Set up a quiet, dedicated study space at home",
          },
          {
            locale: "ms",
            title: "Menyokong Pembelajaran di Rumah",
            excerpt: "Tips dan alat untuk ibu bapa menyokong pembelajaran anak mereka.",
            content: "# Menyokong Pembelajaran di Rumah\n\nPenglibatan anda membuat perbezaan besar dalam pendidikan anak anda.\n\n## Sesi Semakan\n\n- Bantu anak anda dengan kad semakan ulangan berjarak\n- Pantau papan pemuka semakan ibu bapa\n- Galakkan tabiat belajar yang konsisten\n\n## Sumber\n\n- Akses bahan kursus yang dikongsi oleh guru\n- Gunakan sumber pembelajaran yang disyorkan platform\n- Sediakan ruang belajar yang tenang dan khusus di rumah",
          },
        ],
      },
    },
  ];

  for (const guide of forParentsGuides) {
    await prisma.guide.create({ data: guide });
  }

  console.log("Seeding completed successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
