import * as skinview3d from "skinview3d";

const DEFAULT_PROFILE = {
  username: "YourUsername",
  profileId: "PLAYER-0001",
  uuid: "Add your UUID here",
  microsoftAccount: "Not displayed",
  version: "26.3",
  skinPath: "assets/skin.png",
  serverName: "YOUR SERVER NAME",
  serverAddress: "play.example.net",
  serverDescription: "Your Minecraft community starts here.",
  discordUrl: "#",
  youtubeUrl: "#",
  otherUrl: "#"
};

const STORAGE_KEY = "minecraft-player-profile-v1";
let PROFILE = loadProfile();

function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...DEFAULT_PROFILE, ...saved };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}
function saveProfile() {
  // Skin uploads are stored as a data URL in localStorage; other fields are plain text.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(PROFILE));
}
const $ = (id) => document.getElementById(id);

const viewer = new skinview3d.SkinViewer({
  canvas: $("skin_container"),
  width: 500,
  height: 500,
  skin: PROFILE.skinPath
});
viewer.background = null;
viewer.zoom = 0.85;
viewer.fov = 38;
viewer.animation = new skinview3d.IdleAnimation();
viewer.controls.enableRotate = true;
viewer.controls.enableZoom = false;

function applyProfile() {
  $("displayName").textContent = PROFILE.username;
  $("usernameText").textContent = PROFILE.username;
  $("profileId").textContent = PROFILE.profileId;
  $("uuidText").textContent = PROFILE.uuid;
  $("msText").textContent = PROFILE.microsoftAccount;
  $("versionText").textContent = PROFILE.version;
  $("serverName").textContent = PROFILE.serverName;
  $("serverAddress").textContent = PROFILE.serverAddress;
  $("serverDescription").textContent = PROFILE.serverDescription;
  $("avatar").textContent = (PROFILE.username.trim()[0] || "?").toUpperCase();
  $("discordLink").href = safeLink(PROFILE.discordUrl);
  $("youtubeLink").href = safeLink(PROFILE.youtubeUrl);
  $("otherLink").href = safeLink(PROFILE.otherUrl);
  document.title = PROFILE.username + " | Minecraft Player Profile";
  const nameInput = document.querySelector('[name="username"]');
  if (nameInput) {
    for (const [key, value] of Object.entries(PROFILE)) {
      const field = document.querySelector(`[name="${key}"]`);
      if (field && field.type !== "file") field.value = value ?? "";
    }
  }
}
function safeLink(value) {
  if (!value || value === "#") return "#";
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "#";
  } catch { return "#"; }
}
applyProfile();
$("year").textContent = new Date().getFullYear();

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 1600);
}
async function copy(value, label) {
  try {
    await navigator.clipboard.writeText(value);
    toast(label + " copied!");
  } catch {
    toast("Copy unavailable in this browser");
  }
}
$("copyUsername").addEventListener("click", () => copy(PROFILE.username, "Username"));
$("copyAddress").addEventListener("click", () => copy(PROFILE.serverAddress, "Server address"));

const backdrop = $("editorBackdrop");
function openEditor() {
  backdrop.classList.add("open");
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeEditor() {
  backdrop.classList.remove("open");
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}
$("openEditor").addEventListener("click", openEditor);
$("closeEditor").addEventListener("click", closeEditor);
backdrop.addEventListener("click", (event) => {
  if (event.target === backdrop) closeEditor();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeEditor();
});

$("profileForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  for (const key of Object.keys(DEFAULT_PROFILE)) {
    if (key === "skinPath") continue;
    const value = form.get(key);
    if (typeof value === "string") PROFILE[key] = value.trim() || DEFAULT_PROFILE[key];
  }

  const skinFile = $("skinFile").files?.[0];
  if (skinFile) {
    if (skinFile.type !== "image/png") {
      toast("Please choose a PNG skin file");
      return;
    }
    if (skinFile.size > 1024 * 1024) {
      toast("Skin PNG must be under 1 MB");
      return;
    }
    PROFILE.skinPath = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(skinFile);
    });
  }

  try {
    saveProfile();
    applyProfile();
    await viewer.loadSkin(PROFILE.skinPath);
    $("skinFile").value = "";
    toast("Profile saved in this browser!");
    closeEditor();
  } catch (error) {
    console.error(error);
    toast("Could not save. Try a smaller skin PNG.");
  }
});

$("resetProfile").addEventListener("click", () => {
  if (!confirm("Reset this browser's profile details to the starter defaults?")) return;
  PROFILE = { ...DEFAULT_PROFILE };
  localStorage.removeItem(STORAGE_KEY);
  applyProfile();
  viewer.loadSkin(PROFILE.skinPath);
  $("skinFile").value = "";
  toast("Defaults restored");
});
