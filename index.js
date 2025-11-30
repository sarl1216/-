const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require("fs");
const path = require("path");

// =====================
// 1. 파일 / 설정 상수
// =====================
const BIRTHDAY_FILE = path.join(__dirname, "birthdays.json");
const ACTIVITY_FILE = path.join(__dirname, "activity.json");

// 🔴 여기 공지용 채널 ID로 바꿔줘
const BIRTHDAY_CHANNEL_ID = "1260292142543147202";  // 생일 축하 채널
const ACTIVITY_CHANNEL_ID = "1260292141746491420";   // 활동 리포트 보낼 채널

const ROLE_ID = "1260292139493883912";              // 뉴페관리자 역할 ID

// ----- 생일 데이터 로드 -----
let birthdays = {};
try {
  const raw = fs.readFileSync(BIRTHDAY_FILE, "utf8");
  birthdays = JSON.parse(raw);
} catch (e) {
  birthdays = {};
}

function saveBirthdays() {
  fs.writeFileSync(BIRTHDAY_FILE, JSON.stringify(birthdays, null, 2), "utf8");
}

// ----- 활동 데이터 로드 -----
let activity = {};
try {
  const raw = fs.readFileSync(ACTIVITY_FILE, "utf8");
  activity = JSON.parse(raw);
} catch (e) {
  activity = {};
}

function saveActivity() {
  fs.writeFileSync(ACTIVITY_FILE, JSON.stringify(activity, null, 2), "utf8");
}

// =====================
// 2. 디스코드 클라이언트
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =====================
// 3. READY EVENT
// =====================
client.on("ready", () => {
  console.log(`로그인 성공: ${client.user.tag}`);

  // 하루 1회 생일 + 활동 리포트 실행
  scheduleDailyTasks();
});

// =====================
// 4. 메시지 처리
// =====================
client.on("messageCreate", (msg) => {
  if (msg.author.bot) return;

  const guildId = msg.guild?.id;
  const userId = msg.author.id;

  // ───────────────────────────
  // (공통) 활동 기록
  // ───────────────────────────
  if (guildId) {
    if (!activity[guildId]) activity[guildId] = {};
    if (!activity[guildId][userId]) activity[guildId][userId] = 0;
    activity[guildId][userId] += 1;
    saveActivity();
  }

  // ───────────────────────────
  // !환영
  // ───────────────────────────
  if (msg.content.startsWith("!환영")) {
    const mentionedUser = msg.mentions.users.first();

    if (!mentionedUser) {
      msg.channel.send("누구를 환영할지 멘션해줘! 예: `!환영 @유저`");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor("#ffc1dc")
      .setDescription(
`┍━━━━━━━━━━━━━━━━━━━━━━━━━━━━━»•» 🌸 «•«━┑

　　　　　　　⋅.｡  𐐪 **만담** 𐑂 ‧₊˚⊹

✨  새로운 별이 찾아왔어요.  
모두 따뜻하게 맞아주세요. 🌙

👉 **${mentionedUser} 님**, 저희 서버에 오신 걸 환영해요.

적응이 어려우시다면  
언제든지 **@🐣⚘⠂◜뉴페관리자◞⠂⚘🐣** 를 찾아주세요.

다른 역할을 원하신다면  
<#1260292141230587974> 에서 자유롭게 받아주세요.

궁금한 점이나 건의 사항이 있다면  
<#1260292142543147198> 에 남겨주시면 감사드릴게요.

편안한 밤, 편안한 대화가 되길 바랄게요. 🌙

┕━»•» 🌸 «•«━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┙`
      );

    msg.channel.send({
      content: `<@&${ROLE_ID}>`,
      embeds: [embed]
    });
  }

  // ───────────────────────────
  // !생일축하 @유저
  // ───────────────────────────
  if (msg.content.startsWith("!생일축하")) {
    const mentionedUser = msg.mentions.users.first();

    if (!mentionedUser) {
      msg.channel.send("누구를 축하할지 멘션해줘! 예: `!생일축하 @유저`");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor("#ffe066")
      .setTitle("🎂 생일 축하해요!")
      .setDescription(
`오늘은 **${mentionedUser} 님** 의 특별한 날이에요. ✨  

이 서버에서 보내는 한 해가  
조금 더 따뜻하고,  
조금 더 편안하고,  
조금 더 웃을 일이 많았으면 좋겠어요. 🌙

다 같이 ${mentionedUser} 님의 생일을 축하해 주세요! 🎉`
      );

    msg.channel.send({
      content: `@everyone 🎂 오늘은 ${mentionedUser} 님의 생일이에요!`,
      embeds: [embed]
    });
  }

  // ───────────────────────────
  // !내생일 (옵션: birthdays.json을 수동으로 관리하고 싶으면 유지)
// ───────────────────────────
  if (msg.content.startsWith("!내생일")) {
    if (!guildId) return;

    if (!birthdays[guildId] || !birthdays[guildId][userId]) {
      msg.channel.send("아직 생일이 등록되어 있지 않아요! (birthdays.json에 정보가 없어요)");
      return;
    }

    msg.channel.send(`🎂 ${msg.author} 님의 생일은 **${birthdays[guildId][userId]}** 입니다!`);
  }

  // 여기서부터는 예전 생일등록/삭제/오늘생일/이번달생일/생일명령어는 전부 제거됨
});

// =====================
// 5. 공통 날짜 함수
// =====================
function getTodayKST() {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const mm = String(kst.getMonth() + 1).padStart(2, "0");
  const dd = String(kst.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

// =====================
// 6. 생일 체크 (자동 공지용 – birthdays.json 쓰고 싶으면 유지)
// =====================
function checkBirthdays() {
  const today = getTodayKST();
  console.log("생일 체크 실행:", today);

  for (const [guildId, users] of Object.entries(birthdays)) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const channel = guild.channels.cache.get(BIRTHDAY_CHANNEL_ID);
    if (!channel) continue;

    for (const [userId, date] of Object.entries(users)) {
      if (date === today) {
        channel.send(`@everyone 🎂 오늘은 <@${userId}> 님의 생일이에요! 모두 축하해주세요! 🎉`);
      }
    }
  }
}

// =====================
// 7. 활동 리포트
// =====================
function postDailyActivitySummary() {
  console.log("활동 리포트 실행");

  for (const [guildId, users] of Object.entries(activity)) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    const channel = guild.channels.cache.get(ACTIVITY_CHANNEL_ID);
    if (!channel) continue;

    const entries = Object.entries(users);
    if (entries.length === 0) continue;

    // 메시지 수 내림차순 정렬
    entries.sort((a, b) => b[1] - a[1]);
    const top = entries.slice(0, 5);

    let desc = "📊 **오늘의 활동 TOP 멤버**\n";
    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

    top.forEach(([userId, count], idx) => {
      desc += `${medals[idx] || "•"} <@${userId}> — \`${count} 메시지\`\n`;
    });

    channel.send(desc);
  }

  // 다음 날 집계를 위해 초기화
  activity = {};
  saveActivity();
}

// =====================
// 8. 하루 1회 스케줄링
// =====================
function scheduleDailyTasks() {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));

  const next = new Date(kst);
  next.setHours(0, 5, 0, 0); // 00:05 실행

  if (kst > next) {
    next.setDate(next.getDate() + 1);
  }

  const delay = next - kst;
  console.log("다음 데일리 작업까지 남은 ms:", delay);

  setTimeout(() => {
    checkBirthdays();
    postDailyActivitySummary();

    setInterval(() => {
      checkBirthdays();
      postDailyActivitySummary();
    }, 24 * 60 * 60 * 1000); // 24시간마다
  }, delay);
}

// =====================
// 9. 로그인
// =====================
const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error("❌ DISCORD_TOKEN이 설정되어 있지 않습니다.");
  process.exit(1);
}

client.login(token);

