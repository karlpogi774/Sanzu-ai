const fs = require("fs");
const path = require("path");

const ADMIN_ID = "61594055835097";
const DATA_FILE = path.join(__dirname, "bot_weird_100_data.json");
const COOLDOWN_MAP = new Map();

const WEIRD_LINES = [
  "Bakit kaya ang bilis dumaan ng oras kapag natutulog ka sa klase?",
  "Sabi nila infinite daw ang universe, pero bakit parang limitado ang pasensya ko sa mga mababagal mag-isip?",
  "Naisip mo na ba kung ano ang tunay na lasa ng kulay itim?",
  "Ang weird ng mundo, mas mabilis pang masira ang tiwala kaysa sa sirang payong.",
  "Minsan nakatingin lang ako sa pader tapos iniisip ko kung may iniisip din kaya siya tungkol sa akin.",
  "Kung ang isip mo ay parang basurahan, aba'y huwag kang magtaka kung puro basura rin ang lumalabas sa bibig mo.",
  "Hindi ko alam kung sadyang bobo ka lang o nagpapanggap ka lang para mapansin ng crush mo.",
  "Ang weird ng mga tao ngayon, mas pinaniniwalaan pa ang chismis kaysa sa sarili nilang mata.",
  "May mga taong parang multo, biglang sumusulpot kapag may kailangan tapos mawawala na parang bula.",
  "Kung ang katangahan ay may buwis, malamang mayaman ka na sana ngayon dahil sa dami ng ambag mo.",
  "Minsan kailangan mo ring i-reset ang utak mo, baka sakaling bumalik sa matinong pag-iisip.",
  "Ang ganda sana ng araw mo kung hindi ka lang pinanganak na pabigat sa lipunan.",
  "Bakit kaya kapag tahimik ang isang tao, akala nila ang bait-bait, eh baka nagpaplano na lang pala ng kasamaan?",
  "Isang malalim na buntong-hininga para sa mga taong akala mo alam ang lahat pero wala namang alam.",
  "Sana sa susunod na buhay mo, maging Wi-Fi ka naman para kahit papaano may silbi ka sa iba.",
  "Ang hirap makipagtalo sa taong mas mataas pa ang pride kaysa sa grades noong high school.",
  "Huwag kang masyadong mag-ilusyon na mahal ka niya, kaibigan ka lang kapag bored siya.",
  "Ang weird sumulat ng tadhana, binigyan ka ng mukha pero kinaligtaan namang bigyan ng laman ang utak.",
  "Patuloy lang sa pagtakbo ang mundo kahit wala ka namang nararating sa buhay mo.",
  "Nakakabinging katahimikan kapag natauhan ka na hindi ka naman pala talaga importante.",
  "Ubod ka ng galing sa teorya pero sa gawa ay isa kang malaking palamunin.",
  "Minsan mapapaisip ka na lang kung nag-aaral ka ba o nagpapalipas lang ng oras para may masabi kang tapos ka na.",
  "Ang galing mo magpayo sa iba pero sa sarili mong buhay ikaw ang pinaka-lost.",
  "May mga taong akala mo hot, yun pala pampainit lang ng ulo.",
  "Huwag mong ipagmalaki ang yabang mo kung ang laman naman ng bulsa mo ay alikabok at utang.",
  "Kung ang pagiging sipsip ay olympic sport, malamang may gold medal ka na.",
  "Ang sarap mabuhay kung wala kang konsensya, tulad mo na parang walang narinig.",
  "Mag-ingat ka sa mga taong ngumingiti sa harap mo habang may hawak na kutsilyo sa likod.",
  "Hindi lahat ng kumikinang ay ginto, minsan wrapper lang ng kendi na tinapon mo sa daan.",
  "Kahit anong pilit mong magpaka-deep, shallow pa rin ang tingin ng mga tao sa'yo.",
  "Ang lakas ng loob mong manghusga, eh ikaw nga mismo hindi alam ang direksyon ng buhay mo.",
  "Pilit mong kinakamay ang tagumpay pero ni hindi mo nga mahawakan nang maayos ang sarili mong desisyon.",
  "May mga taong ipinanganak para maging bida, tapos ikaw naman yung extra na nadapa sa eksena.",
  "Huwag kang magmalaki sa achievement ng iba na parang ikaw ang nagpagod.",
  "Ang sarap pakinggan ng mga pangarap mo kung hindi lang pawang kasinungalingan.",
  "Kung may award lang sa pagiging paasa, baka ikaw na ang CEO.",
  "Hindi ka naman talagang busy, sadyang wala lang silbi ang presensya mo sa kanila.",
  "Paano mo masasabing tapos ka na eh simula pa lang palpak na ang diskarte mo?",
  "Mag-isip-isip ka naman bago ka magsalita para hindi nasasayang ang laway ng mga nakikinig sa'yo.",
  "Ang yabang mo magsalita pero sa simpleng problema umiiyak ka na sa gilid.",
  "Taas ng pangarap mo pero mababa naman ang lipad ng utak mo.",
  "Sana binigyan ka rin ni Lord ng kaunting hiya bukod sa kapal ng mukha.",
  "Huwag kang mag-alala, hindi ka nag-iisa sa katangahan mo, marami kayong lahi.",
  "Ang galing mo magtago ng sekreto pero bakit ang dali mong mabuko?",
  "Minsan kailangan mo ring tumingin sa salamin para malaman mo kung sino talaga ang problema.",
  "Parang kanta ka lang na paulit-ulit ang tugtog pero wala namang kwenta ang lyrics.",
  "Hindi ka special, sadyang mababa lang ang standard ng mga pumupuri sa'yo.",
  "Ang bilis mong manghusga sa mali ng iba parang wala kang kasalanan sa mundo.",
  "Kung may paligsahan sa pagiging bida-bida, sigurado akong ikaw ang champion.",
  "Wala kang mararating kung ang tanging alam mo lang ay magreklamo at umasa.",
  "Ang tigas ng mukha mong humingi ng tulong pagkatapos mong siraan ang tumulong sa'yo.",
  "Mag-focus ka sa sarili mong buhay bago ka manghimasok sa buhay ng may buhay.",
  "Huwag mong sabihing malakas ka kung sa simpleng hangin lang ay natatangay ka na.",
  "Ang galing mong umarte na parang ikaw ang biktima kahit ikaw naman ang may gawa.",
  "Nakakapagod intindihin ang taong sarili lang ang iniisip.",
  "Kung ang katamaran ay may sweldo, milyonaryo ka na sana ngayon.",
  "Ang dami mong sinasabi pero wala namang laman ang utak mo.",
  "Huwag kang magmalinis kung ikaw ang pinakamarumi mag-isip sa inyong grupo.",
  "Sana maging kasinghaba ng pasensya ko ang buhay mo para matauhan ka na.",
  "Ang sarap mong itapon sa ibang planeta para mabawasan ang sakit sa ulo ng mundo.",
  "Paano mo maipagmamalaki ang sarili mo kung ang gawa mo ay puro paninira lang?",
  "May mga taong akala mo matalino, yun pala mas marunong pang magpanggap.",
  "Huwag mong hintaying magsawa ang mga tao sa ugali mong nakakasuka.",
  "Ang yabang mo sa chat pero sapersonal tiklop ka naman.",
  "Hindi ka cool, sadyang mukha lang kang ewan kapag nagmamalaki ka.",
  "Ang sarap mong patulugin nang tuluyan para manahimik na ang mundo.",
  "Pilit mong inaangkin ang tagumpay na pinagpagan ng iba.",
  "Magbago ka na habang may oras pa, hindi habangbuhay nagtitimpi ang mga tao sa'yo.",
  "Ang galing mong magtago sa likod ng fake accounts dahil duwag ka sa totoong buhay.",
  "Wala kang mararating kung ang hangarin mo ay hilahin pababa ang kapwa mo.",
  "Ang taas ng tingin mo sa sarili mo, eh kuko ka lang naman sa paa ng iba.",
  "Masyado kang pabebe para sa edad mong mukhang matanda na.",
  "Huwag kang mag-inarte kung ikaw naman ang pasimula ng gulo.",
  "Ang sarap mong bigyan ng award sa pagiging pabigat sa lipunan.",
  "Paulit-ulit na lang ang drama mo, wala na bang bago?",
  "Mag-isip ka gamit ang utak, hindi gamit ang emosyon mong sabog.",
  "Ang galing mong manisi ng iba para lang maitago ang sarili mong kapalpakan.",
  "Hindi ka kawalan sa grupo, masaya nga sila nung nawala ka eh.",
  "Ang kapal ng mukha mong humingi ng pabor pagkatapos ng ginawa mo.",
  "Wala ka namang napatunayan para magmaganda nang ganyan.",
  "Ang bilis mong kumampi sa kung saan may pabor sa'yo.",
  "Masyado kang papansin kaya ka tuloy binabale-wala.",
  "Huwag kang maging bida kung hindi mo naman kaya gampanan ang responsibilidad.",
  "Ang galing mo mamintas ng pisikal ng iba, eh ikaw nga parang dumaan sa giyera ang mukha mo.",
  "Magtrabaho ka nang maayos para hindi ka na umasa sa iba.",
  "Ang daldal mo pero wala namang sustansya ang mga pinagsasabi mo.",
  "Huwag kang umasang rerespetuhin ka kung ikaw mismo walang respeto sa iba.",
  "Ang taas ng pride mo pero wala ka namang maipagmalaki.",
  "Masyado kang reklamador para sa taong walang ambag.",
  "Ang galing mong mangutang pero pagdating sa bayaran nagiging multo ka na.",
  "Huwag kang magmalaki sa kung anong meron ka dahil hiniram mo lang lahat yan.",
  "Ang sarap mong sapakin paminsan-minsan para matauhan ka sa kahibangan mo.",
  "Wala kang kwentang kasama sa panahong kailangan ka ng kaibigan mo.",
  "Ang bilis mong mang-iiwan sa ere kapag alanganin na ang sitwasyon.",
  "Mag-isa ka na lang habangbuhay dahil sa ugali mong demonyo.",
  "Ang galing mong magsalita ng patalikod pero sa harap ka sumisipsip.",
  "Hindi ka astig, sadyang salot ka lang sa lipunan.",
  "Tapusin na natin ang usapang ito dahil sayang lang ang oras sa'yo.",
  "Isang malaking joke ang buong pagkatao mo, kaya tumawa na lang tayo."
];

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (e) {}
  return { active: true };
}

function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {}
}

function sendWithTyping(api, threadID, text, replyMsgID) {
  if (typeof api.sendTypingIndicator === "function") {
    api.sendTypingIndicator(threadID, () => {});
  }
  setTimeout(() => {
    api.sendMessage(text, threadID, () => {}, replyMsgID);
  }, 5000);
}

module.exports.config = {
  name: "weirdbot100",
  version: "3.0.0",
  hasPermission: 2,
  credits: "System",
  description: "Nonstop Admin Bot with 100 lines of weird roasts, typing delay & anti-spam",
  usePrefix: true,
  cooldowns: 2
};

module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, messageID } = event;
  if (!threadID || !senderID) return;

  const emojis = ["👁️", "🌀", "🧩", "👽", "🔮", "🎭", "💀"];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  
  try {
    api.setMessageReaction(randomEmoji, messageID, () => {}, true);
  } catch (e) {}

  if (senderID === ADMIN_ID) return;

  const now = Date.now();
  const userCooldown = COOLDOWN_MAP.get(senderID) || 0;
  if (now - userCooldown < 4000) {
    sendWithTyping(api, threadID, "⚠️ Anti-Spam: Teka lang, masyado kang mabilis mag-type!", messageID);
    return;
  }
  COOLDOWN_MAP.set(senderID, now);

  const data = loadData();
  if (data.active && Math.random() < 0.20) {
    const randomLine = WEIRD_LINES[Math.floor(Math.random() * WEIRD_LINES.length)];
    sendWithTyping(api, threadID, `💭 [Weird 100]: ${randomLine}`, messageID);
  }
};

module.exports.run = async function({ api, event, args }) {
  const { threadID, senderID, messageID } = event;
  
  if (senderID !== ADMIN_ID) {
    return sendWithTyping(api, threadID, "❌ Tanging ang Admin ID 61594055835097 lamang ang may hawak nito!", messageID);
  }

  const sub = (args[0] || "").toLowerCase();
  let data = loadData();

  if (sub === "off") {
    data.active = false;
    saveData(data);
    return sendWithTyping(api, threadID, "🛑 100-Line Weird Nonstop Bot turned OFF.", messageID);
  }

  if (sub === "on") {
    data.active = true;
    saveData(data);
    return sendWithTyping(api, threadID, "🚀 100-Line Weird Nonstop Bot activated 24/7!", messageID);
  }

  return sendWithTyping(api, threadID, "🔮 Command Center | Gamitin ang: /weirdbot100 on o /weirdbot100 off", messageID);
};
