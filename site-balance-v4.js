document.addEventListener("DOMContentLoaded", () => {
  const note = document.createElement("div");
  note.className = "balance-note";
  note.innerHTML = "Баланс v4: HP блоков растёт ускоренно. Первые этапы мягкие, дальше появляется стена под мета-прогрессию.";
  document.querySelector(".head")?.appendChild(note);
});
