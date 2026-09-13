/* ============================================================
   AI MR FERDY - PROFESSIONAL CHAT UI
   ============================================================ */

(() => {
  "use strict";

  /* ==========================================================
     CONFIG
     ========================================================== */

  const API_URL = "/api/chat";

  const STORAGE_KEY = "aimrferdy_chat_history_v2";
  const CURRENT_CHAT_KEY = "aimrferdy_current_chat_v2";

  const MAX_HISTORY = 100;
  const MAX_CONTEXT_CHARS = 24000;


  /* ==========================================================
     DOM
     ========================================================== */

  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebar-overlay");
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");

  const historyEl = document.getElementById("history");

  const newChatBtn = document.getElementById("new-chat-btn");
  const historySearch = document.getElementById("history-search");
  const historySearchClear = document.getElementById("history-search-clear");

  const topbarTitle = document.getElementById("topbar-title");
  const copyChatBtn = document.getElementById("copy-chat-btn");
  const exportChatBtn = document.getElementById("export-chat-btn");
  const scrollBottomBtn = document.getElementById("scroll-bottom-btn");

  const chatScroll = document.getElementById("chat-scroll");
  const chatContainer = document.getElementById("chat-container");

  const welcome = document.getElementById("welcome");
  const messagesEl = document.getElementById("messages");

  const composerForm = document.getElementById("composer-form");
  const input = document.getElementById("message-input");

  const sendBtn = document.getElementById("send-btn");
  const sendIcon = document.getElementById("send-icon");
  const stopIcon = document.getElementById("stop-icon");

  const chatMenu = document.getElementById("chat-menu");
  const menuRename = document.getElementById("menu-rename");
  const menuPin = document.getElementById("menu-pin");
  const menuDelete = document.getElementById("menu-delete");

  const renameModal = document.getElementById("rename-modal");
  const renameInput = document.getElementById("rename-input");
  const renameCancel = document.getElementById("rename-cancel");
  const renameSave = document.getElementById("rename-save");

  const deleteModal = document.getElementById("delete-modal");
  const deleteCancel = document.getElementById("delete-cancel");
  const deleteConfirm = document.getElementById("delete-confirm");


  /* ==========================================================
     STATE
     ========================================================== */

  let chats = loadChats();

  let currentChatId = localStorage.getItem(
    CURRENT_CHAT_KEY
  );

  let activeMenuChatId = null;
  let historySearchQuery = "";
  let userScrolledUp = false;

  let renameChatId = null;
  let deleteChatId = null;

  let abortController = null;
  let isGenerating = false;


  /* ==========================================================
     INITIALIZATION
     ========================================================== */

  function init() {

    if (!Array.isArray(chats)) {
      chats = [];
    }

    chats = chats.slice(0, MAX_HISTORY);

    chats.forEach(chat => {
      if (typeof chat.pinned !== "boolean") chat.pinned = false;
      if (!Array.isArray(chat.messages)) chat.messages = [];
    });

    if (
      currentChatId &&
      !chats.some(chat => chat.id === currentChatId)
    ) {
      currentChatId = null;
    }

    if (!currentChatId) {
      createNewChat(false);
    } else {
      renderHistory();
      loadChat(currentChatId);
    }

    setupEvents();

    updateSendButton();
    resizeTextarea();

  }


  /* ==========================================================
     EVENTS
     ========================================================== */

  function setupEvents() {

    composerForm?.addEventListener(
      "submit",
      event => {
        event.preventDefault();

        sendMessage();
      }
    );


    input?.addEventListener(
      "input",
      () => {
        resizeTextarea();
        updateSendButton();
      }
    );


    input?.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.isComposing
        ) {
          event.preventDefault();

          sendMessage();
        }

      }
    );


    historySearch?.addEventListener(
      "input",
      () => {
        historySearchQuery = historySearch.value.trim().toLowerCase();
        updateHistorySearchUI();
        renderHistory();
      }
    );

    historySearchClear?.addEventListener(
      "click",
      () => {
        if (!historySearch) return;
        historySearch.value = "";
        historySearchQuery = "";
        updateHistorySearchUI();
        renderHistory();
        historySearch.focus();
      }
    );

    copyChatBtn?.addEventListener("click", copyCurrentChat);
    exportChatBtn?.addEventListener("click", exportCurrentChat);
    scrollBottomBtn?.addEventListener("click", () => scrollToBottom(true, true));
    chatScroll?.addEventListener("scroll", updateScrollButton, { passive: true });

    newChatBtn?.addEventListener(
      "click",
      () => {
        createNewChat(true);
      }
    );


    mobileMenuBtn?.addEventListener(
      "click",
      toggleSidebar
    );


    sidebarOverlay?.addEventListener(
      "click",
      closeSidebar
    );


    document.addEventListener(
      "click",
      event => {

        if (
          chatMenu &&
          !chatMenu.hidden &&
          !chatMenu.contains(event.target)
        ) {
          closeChatMenu();
        }

      }
    );


    menuPin?.addEventListener(
      "click",
      () => {
        if (!activeMenuChatId) return;
        const id = activeMenuChatId;
        closeChatMenu();
        togglePinChat(id);
      }
    );

    menuRename?.addEventListener(
      "click",
      () => {

        if (!activeMenuChatId) {
          return;
        }

        const id = activeMenuChatId;

        closeChatMenu();

        openRenameModal(id);

      }
    );


    menuDelete?.addEventListener(
      "click",
      () => {

        if (!activeMenuChatId) {
          return;
        }

        const id = activeMenuChatId;

        closeChatMenu();

        openDeleteModal(id);

      }
    );


    renameCancel?.addEventListener(
      "click",
      closeRenameModal
    );


    renameSave?.addEventListener(
      "click",
      saveRename
    );


    renameInput?.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {
          event.preventDefault();

          saveRename();
        }

        if (event.key === "Escape") {
          event.preventDefault();

          closeRenameModal();
        }

      }
    );


    renameModal?.addEventListener(
      "click",
      event => {

        if (event.target === renameModal) {
          closeRenameModal();
        }

      }
    );


    deleteCancel?.addEventListener(
      "click",
      closeDeleteModal
    );


    deleteConfirm?.addEventListener(
      "click",
      confirmDelete
    );


    deleteModal?.addEventListener(
      "click",
      event => {

        if (event.target === deleteModal) {
          closeDeleteModal();
        }

      }
    );


    document.addEventListener(
      "keydown",
      event => {

        if (event.key === "Escape") {

          closeChatMenu();

          closeRenameModal();

          closeDeleteModal();

        }

      }
    );


    document.querySelectorAll(
      ".prompt-btn"
    ).forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const prompt =
            button.dataset.prompt || "";

          if (!prompt) {
            return;
          }

          input.value = prompt;

          resizeTextarea();

          updateSendButton();

          input.focus();

        }
      );

    });

  }


  /* ==========================================================
     CHAT DATA
     ========================================================== */

  function loadChats() {

    try {

      const raw =
        localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return [];
      }

      const parsed =
        JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed;

    } catch (error) {

      console.error(
        "Gagal membaca history chat:",
        error
      );

      return [];

    }

  }


  function saveChats() {

    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(chats)
      );

      if (currentChatId) {

        localStorage.setItem(
          CURRENT_CHAT_KEY,
          currentChatId
        );

      }

    } catch (error) {

      console.error(
        "Gagal menyimpan chat:",
        error
      );

    }

  }


  function createChatObject() {

    return {

      id: generateId(),

      title: "Chat baru",

      createdAt: Date.now(),

      updatedAt: Date.now(),

      messages: []

    };

  }


  function generateId() {

    return (
      "chat_" +
      Date.now().toString(36) +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 9)
    );

  }


  function getCurrentChat() {

    return chats.find(
      chat => chat.id === currentChatId
    );

  }


  /* ==========================================================
     NEW CHAT
     ========================================================== */

  function createNewChat(focusInput = true) {

    if (isGenerating) {
      stopGeneration();
    }

    closeChatMenu();
    closeSidebar();

    const chat = createChatObject();

    chats.unshift(chat);

    chats = chats.slice(0, MAX_HISTORY);

    chats.forEach(chat => {
      if (typeof chat.pinned !== "boolean") chat.pinned = false;
      if (!Array.isArray(chat.messages)) chat.messages = [];
    });

    currentChatId = chat.id;

    saveChats();

    renderHistory();

    renderCurrentChat();

    if (focusInput) {
      setTimeout(() => {
        input?.focus();
      }, 50);
    }

  }


  /* ==========================================================
     LOAD CHAT
     ========================================================== */

  function loadChat(id) {

    const chat =
      chats.find(item => item.id === id);

    if (!chat) {
      return;
    }

    if (isGenerating) {
      stopGeneration();
    }

    currentChatId = id;

    localStorage.setItem(
      CURRENT_CHAT_KEY,
      id
    );

    renderHistory();

    renderCurrentChat();

    closeSidebar();

  }


  function renderCurrentChat() {

    const chat = getCurrentChat();

    if (!chat) {
      return;
    }

    topbarTitle.textContent =
      chat.title || "Chat baru";

    messagesEl.innerHTML = "";

    if (!chat.messages || chat.messages.length === 0) {

      welcome.style.display = "";

      return;

    }

    welcome.style.display = "none";

    chat.messages.forEach((message, index) => {
      if (
        message.role !== "user" &&
        message.role !== "assistant"
      ) {
        return;
      }
      appendMessage(
        message.role,
        message.content,
        false,
        message,
        index
      );
    });

    scrollToBottom(false);

  }


  /* ==========================================================
     HISTORY
     ========================================================== */

  function renderHistory() {
    if (!historyEl) return;
    historyEl.innerHTML = "";
    const query = historySearchQuery;
    const filtered = query ? chats.filter(chat => chatMatchesSearch(chat, query)) : chats;
    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "history-empty";
      empty.textContent = query ? "Tidak ada chat yang cocok." : "Belum ada percakapan.";
      historyEl.appendChild(empty);
      return;
    }
    const pinned = filtered.filter(chat => chat.pinned);
    if (pinned.length) {
      appendHistoryGroup("Pinned", pinned);
    }
    const unpinned = filtered.filter(chat => !chat.pinned);
    if (query) {
      if (unpinned.length) appendHistoryGroup("Search results", unpinned);
      return;
    }
    const groups = groupChatsByDate(unpinned);
    ["Today", "Yesterday", "Previous 7 Days", "Older"].forEach(groupName => {
      const items = groups[groupName];
      if (items?.length) appendHistoryGroup(groupName, items);
    });
  }

  function appendHistoryGroup(groupName, items) {
    const group = document.createElement("section");
    group.className = "history-group";
    const title = document.createElement("div");
    title.className = "history-title";
    title.textContent = groupName;
    group.appendChild(title);
    items.forEach(chat => group.appendChild(createHistoryItem(chat)));
    historyEl.appendChild(group);
  }

  function chatMatchesSearch(chat, query) {
    const title = chat.title || "";
    const content = (chat.messages || []).map(message => message?.content || "").join(" ");
    return `${title} ${content}`.toLowerCase().includes(query);
  }

  function updateHistorySearchUI() {
    if (!historySearchClear || !historySearch) return;
    historySearchClear.hidden = !historySearch.value;
  }

  function togglePinChat(id) {
    const chat = chats.find(item => item.id === id);
    if (!chat) return;
    chat.pinned = !chat.pinned;
    chat.updatedAt = Date.now();
    saveChats();
    renderHistory();
  }


  function createHistoryItem(chat) {

    const row =
      document.createElement("div");

    row.className =
      "history-item";

    if (chat.id === currentChatId) {
      row.classList.add("active");
    }
    if (chat.pinned) {
      row.classList.add("pinned");
    }


    const content =
      document.createElement("div");

    content.className =
      "history-item-content";


    const icon =
      document.createElement("span");

    icon.className =
      "history-item-icon";

    icon.textContent =
      chat.pinned ? "📌" : "◌";


    const title =
      document.createElement("span");

    title.className =
      "history-item-title";

    title.textContent =
      chat.title || "Chat baru";


    content.appendChild(icon);

    content.appendChild(title);


    const menuButton =
      document.createElement("button");

    menuButton.type = "button";

    menuButton.className =
      "history-menu-btn";

    menuButton.setAttribute(
      "aria-label",
      "Menu chat"
    );

    menuButton.textContent =
      "⋯";


    menuButton.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        openChatMenu(
          chat.id,
          menuButton
        );

      }
    );


    row.appendChild(content);

    row.appendChild(menuButton);


    row.addEventListener(
      "click",
      () => {

        loadChat(chat.id);

      }
    );


    return row;

  }


  function groupChatsByDate(list) {

    const groups = {

      Today: [],

      Yesterday: [],

      "Previous 7 Days": [],

      Older: []

    };


    const now = new Date();

    const todayStart =
      startOfDay(now);


    const yesterdayStart =
      new Date(todayStart);

    yesterdayStart.setDate(
      yesterdayStart.getDate() - 1
    );


    const previous7Start =
      new Date(todayStart);

    previous7Start.setDate(
      previous7Start.getDate() - 7
    );


    for (const chat of list) {

      const date =
        new Date(
          chat.updatedAt ||
          chat.createdAt ||
          Date.now()
        );


      if (date >= todayStart) {

        groups.Today.push(chat);

      } else if (date >= yesterdayStart) {

        groups.Yesterday.push(chat);

      } else if (date >= previous7Start) {

        groups["Previous 7 Days"].push(chat);

      } else {

        groups.Older.push(chat);

      }

    }


    return groups;

  }


  function startOfDay(date) {

    const result =
      new Date(date);

    result.setHours(
      0,
      0,
      0,
      0
    );

    return result;

  }


  /* ==========================================================
     RENAME
     ========================================================== */

  function openRenameModal(id) {

    const chat =
      chats.find(
        item => item.id === id
      );

    if (!chat) {
      return;
    }

    renameChatId = id;

    renameInput.value =
      chat.title || "Chat baru";

    renameModal.classList.add("show");

    setTimeout(() => {

      renameInput.focus();

      renameInput.select();

    }, 50);

  }


  function closeRenameModal() {

    renameModal.classList.remove("show");

    renameChatId = null;

  }


  function saveRename() {

    if (!renameChatId) {
      return;
    }

    const chat =
      chats.find(
        item => item.id === renameChatId
      );

    if (!chat) {
      closeRenameModal();

      return;
    }


    const title =
      renameInput.value
        .trim()
        .replace(/\s+/g, " ");


    if (!title) {
      renameInput.focus();

      return;
    }


    chat.title =
      title.slice(0, 80);

    chat.updatedAt =
      Date.now();


    saveChats();

    renderHistory();

    renderCurrentChat();

    closeRenameModal();

  }


  /* ==========================================================
     DELETE
     ========================================================== */

  function openDeleteModal(id) {

    const chat =
      chats.find(
        item => item.id === id
      );

    if (!chat) {
      return;
    }

    deleteChatId = id;

    deleteModal.classList.add("show");

  }


  function closeDeleteModal() {

    deleteModal.classList.remove("show");

    deleteChatId = null;

  }


  function confirmDelete() {

    if (!deleteChatId) {
      return;
    }


    const id =
      deleteChatId;


    chats =
      chats.filter(
        chat => chat.id !== id
      );


    if (currentChatId === id) {

      if (chats.length > 0) {

        currentChatId =
          chats[0].id;

      } else {

        currentChatId = null;

      }

    }


    saveChats();

    closeDeleteModal();


    if (!currentChatId) {

      createNewChat(false);

    } else {

      renderHistory();

      renderCurrentChat();

    }

  }


  /* ==========================================================
     CHAT MENU
     ========================================================== */

  function openChatMenu(id, button) {

    activeMenuChatId = id;

    const menuChat = chats.find(item => item.id === id);
    if (menuPin) {
      menuPin.querySelector("span")?.replaceChildren(document.createTextNode(menuChat?.pinned ? "Unpin" : "Pin chat"));
    }

    chatMenu.hidden = false;


    const rect =
      button.getBoundingClientRect();


    let left =
      rect.right - 150;

    let top =
      rect.bottom + 4;


    if (left < 8) {
      left = 8;
    }

    if (
      left + 150 >
      window.innerWidth - 8
    ) {
      left =
        window.innerWidth - 158;
    }


    if (
      top + 80 >
      window.innerHeight - 8
    ) {
      top =
        rect.top - 84;
    }


    chatMenu.style.left =
      `${left}px`;

    chatMenu.style.top =
      `${top}px`;

  }


  function closeChatMenu() {

    chatMenu.hidden = true;

    activeMenuChatId = null;

  }


  /* ==========================================================
     SEND MESSAGE
     ========================================================== */

  async function sendMessage() {

    if (isGenerating) {
      return;
    }


    const text =
      input.value.trim();


    if (!text) {
      return;
    }


    let chat =
      getCurrentChat();


    if (!chat) {

      createNewChat(false);

      chat =
        getCurrentChat();

    }


    if (!chat) {
      return;
    }


    const isFirstMessage =
      chat.messages.length === 0;


    const userMessage = {
      role: "user",
      content: text,
      timestamp: Date.now()
    };


    chat.messages.push(
      userMessage
    );


    chat.updatedAt =
      Date.now();


    if (isFirstMessage) {

      chat.title =
        createTitleFromMessage(text);

    }


    saveChats();

    renderHistory();

    renderCurrentChat();


    input.value = "";

    resizeTextarea();

    updateSendButton();


    await requestAI(chat);

  }


  /* ==========================================================
     AI REQUEST / SSE STREAM
     ========================================================== */

  async function requestAI(chat) {

    isGenerating = true;

    setGeneratingState(true);


    const assistantMessage = {
      role: "assistant",
      content: "",
      timestamp: Date.now()
    };


    chat.messages.push(
      assistantMessage
    );


    chat.updatedAt =
      Date.now();


    welcome.style.display = "none";


    const assistantElement =
      appendMessage(
        "assistant",
        "",
        false,
        assistantMessage,
        chat.messages.length - 1
      );


    const contentElement =
      assistantElement.querySelector(
        ".message-content"
      );

    if (contentElement) {
      contentElement.innerHTML = '<div class="typing" aria-label="AI sedang mengetik"><span></span><span></span><span></span></div>';
    }

    abortController =
      new AbortController();


    try {

      const response =
        await fetch(
          API_URL,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Accept":
                "text/event-stream"
            },

            body: JSON.stringify({
              messages: buildContextMessages(chat.messages)
            }),

            signal:
              abortController.signal
          }
        );


      if (!response.ok) {

        let errorMessage =
          `Server error (${response.status})`;

        try {

          const data =
            await response.json();

          if (data?.error) {
            errorMessage =
              data.error;
          }

        } catch (_) {}

        throw new Error(
          errorMessage
        );

      }


      if (!response.body) {
        throw new Error(
          "Response streaming tidak tersedia."
        );
      }


      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder(
          "utf-8"
        );


      let buffer = "";

      let done = false;


      while (!done) {

        const result =
          await reader.read();

        done =
          result.done;


        if (result.value) {

          buffer +=
            decoder.decode(
              result.value,
              {
                stream: !done
              }
            );


          const parsed =
            processSSEBuffer(
              buffer
            );


          buffer =
            parsed.remaining;


          for (
            const event of parsed.events
          ) {

            const text =
              extractStreamText(
                event
              );


            if (!text) {
              continue;
            }


            assistantMessage.content +=
              text;


            renderMarkdownInto(
              contentElement,
              assistantMessage.content
            );


            scrollToBottom();

          }

        }

      }


      if (buffer.trim()) {

        const events =
          parseSSEEvents(
            buffer
          );


        for (
          const event of events
        ) {

          const text =
            extractStreamText(
              event
            );


          if (!text) {
            continue;
          }


          assistantMessage.content +=
            text;

        }

      }


      if (
        !assistantMessage.content.trim()
      ) {

        assistantMessage.content =
          "Maaf, AI tidak memberikan respons.";

      }


      renderMarkdownInto(
        contentElement,
        assistantMessage.content
      );


      addMessageActions(
        assistantElement,
        assistantMessage.content,
        "assistant",
        chat.messages.length - 1
      );


      chat.updatedAt =
        Date.now();


      saveChats();

      renderHistory();

      scrollToBottom();


    } catch (error) {

      if (
        error?.name ===
        "AbortError"
      ) {

        if (
          !assistantMessage.content.trim()
        ) {

          chat.messages =
            chat.messages.filter(
              message =>
                message !==
                assistantMessage
            );

          assistantElement.remove();

        }

      } else {

        console.error(
          "Chat error:",
          error
        );


        const errorText =
          `Maaf, terjadi error saat menghubungi AI.\n\n${error?.message || "Silakan coba lagi."}`;


        assistantMessage.content =
          errorText;


        renderMarkdownInto(
          contentElement,
          errorText
        );


        addMessageActions(
          assistantElement,
          errorText
        );


        saveChats();

      }

    } finally {

      isGenerating = false;

      abortController = null;

      setGeneratingState(false);

      renderHistory();

      scrollToBottom();

    }

  }


  /* ==========================================================
     SSE PARSER
     ========================================================== */

  function processSSEBuffer(buffer) {

    const normalized =
      buffer.replace(/\r\n/g, "\n");


    const parts =
      normalized.split(
        "\n\n"
      );


    const remaining =
      parts.pop() || "";


    const events = [];


    for (
      const part of parts
    ) {

      const trimmed =
        part.trim();


      if (trimmed) {
        events.push(trimmed);
      }

    }


    return {
      events,
      remaining
    };

  }


  function parseSSEEvents(buffer) {

    const normalized =
      buffer.replace(/\r\n/g, "\n");


    return normalized
      .split("\n\n")
      .map(
        item => item.trim()
      )
      .filter(Boolean);

  }


  function extractStreamText(event) {

    const lines =
      event.split("\n");


    const dataLines = [];


    for (
      const line of lines
    ) {

      if (
        line.startsWith("data:")
      ) {

        dataLines.push(
          line.slice(5).trim()
        );

      }

    }


    if (!dataLines.length) {
      return "";
    }


    const data =
      dataLines.join("\n");


    if (
      data === "[DONE]"
    ) {
      return "";
    }


    try {

      const parsed =
        JSON.parse(data);


      if (
        typeof parsed ===
        "string"
      ) {
        return parsed;
      }


      if (
        typeof parsed.response ===
        "string"
      ) {
        return parsed.response;
      }


      if (
        typeof parsed.text ===
        "string"
      ) {
        return parsed.text;
      }


      if (
        typeof parsed.content ===
        "string"
      ) {
        return parsed.content;
      }


      if (
        parsed.result &&
        typeof parsed.result.response ===
        "string"
      ) {
        return parsed.result.response;
      }


      if (
        parsed.result &&
        typeof parsed.result.text ===
        "string"
      ) {
        return parsed.result.text;
      }


      return "";

    } catch (_) {

      return data;

    }

  }


  /* ==========================================================
     MESSAGE RENDER
     ========================================================== */

  function appendMessage(
    role,
    content,
    shouldScroll = true,
    messageData = null,
    messageIndex = -1
  ) {

    const message =
      document.createElement("article");

    message.className =
      `message ${role}`;
    if (messageIndex >= 0) {
      message.dataset.messageIndex = String(messageIndex);
    }


    const inner =
      document.createElement("div");

    inner.className =
      "message-inner";


    const avatar =
      document.createElement("div");

    avatar.className =
      `avatar ${
        role === "assistant"
          ? "assistant-avatar"
          : "user-avatar"
      }`;

    avatar.textContent =
      role === "assistant"
        ? "F"
        : "U";


    const body =
      document.createElement("div");

    body.className =
      "message-body";


    const contentEl =
      document.createElement("div");

    contentEl.className =
      "message-content markdown";


    if (content) {

      if (role === "assistant") {

        renderMarkdownInto(
          contentEl,
          content
        );

      } else {

        contentEl.textContent =
          content;

      }

    }


    body.appendChild(
      contentEl
    );

    const timestamp = document.createElement("time");
    timestamp.className = "message-time";
    timestamp.dateTime = messageData?.timestamp
      ? new Date(messageData.timestamp).toISOString()
      : "";
    timestamp.textContent = formatMessageTime(messageData?.timestamp);
    if (timestamp.textContent) {
      body.appendChild(timestamp);
    }

    if (role === "assistant" && content) {
      addMessageActions(message, content, role, messageIndex);
    } else if (role === "user" && content) {
      addMessageActions(message, content, role, messageIndex);
    }


    inner.appendChild(
      avatar
    );

    inner.appendChild(
      body
    );


    message.appendChild(
      inner
    );


    messagesEl.appendChild(
      message
    );


    if (shouldScroll) {
      scrollToBottom();
    }


    return message;

  }


  /* ==========================================================
     MARKDOWN
     ========================================================== */

  function renderMarkdownInto(
    element,
    markdown
  ) {

    if (!element) {
      return;
    }


    if (
      typeof marked ===
      "undefined"
    ) {

      element.textContent =
        markdown;

      return;

    }


    try {

      marked.setOptions({

        gfm: true,

        breaks: true

      });


      const html =
        marked.parse(
          markdown || ""
        );


      if (
        typeof DOMPurify !==
        "undefined"
      ) {

        element.innerHTML =
          DOMPurify.sanitize(
            html,
            {
              ADD_ATTR: [
                "target",
                "rel"
              ]
            }
          );

      } else {

        element.innerHTML =
          html;

      }


      enhanceCodeBlocks(
        element
      );


      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const parent = node.parentElement;
            if (
              !parent ||
              parent.closest("a,code,pre") ||
              !/(?:https?:\/\/|www\.)?aimrferdy\.net/i.test(node.nodeValue || "")
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const textNodes = [];
      while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
      }

      const urlPattern =
        /(^|[\s(>])((?:https?:\/\/|www\.)?aimrferdy\.net(?:\/[^\s<)]*)?)/gi;

      textNodes.forEach(node => {
        const text = node.nodeValue || "";
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        text.replace(urlPattern, (match, prefix, url, offset) => {
          fragment.appendChild(
            document.createTextNode(text.slice(lastIndex, offset) + prefix)
          );

          const link = document.createElement("a");
          const href = /^https?:\/\//i.test(url)
            ? url
            : `https://${url}`;

          link.href = href;
          link.textContent = url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          fragment.appendChild(link);

          lastIndex = offset + match.length;
          return match;
        });

        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        node.parentNode.replaceChild(fragment, node);
      });


      element
        .querySelectorAll(
          "a"
        )
        .forEach(link => {

          link.target =
            "_blank";

          link.rel =
            "noopener noreferrer";

        });


    } catch (error) {

      console.error(
        "Markdown error:",
        error
      );

      element.textContent =
        markdown;

    }

  }


  function enhanceCodeBlocks(
    container
  ) {

    container
      .querySelectorAll(
        "pre"
      )
      .forEach(pre => {

        if (
          pre.parentElement?.classList.contains(
            "code-wrapper"
          )
        ) {
          return;
        }


        const code =
          pre.querySelector(
            "code"
          );


        if (!code) {
          return;
        }


        let language =
          getCodeLanguage(
            code
          );


        if (
          typeof hljs !==
          "undefined"
        ) {

          try {

            if (
              language &&
              hljs.getLanguage(
                language
              )
            ) {

              code.classList.add(
                `language-${language}`
              );

              hljs.highlightElement(
                code
              );

            } else {

              const result =
                hljs.highlightAuto(
                  code.textContent
                );

              code.innerHTML =
                result.value;

              language =
                result.language ||
                "";

            }

          } catch (_) {}

        }


        const wrapper =
          document.createElement(
            "div"
          );

        wrapper.className =
          "code-wrapper";


        const header =
          document.createElement(
            "div"
          );

        header.className =
          "code-header";


        const languageEl =
          document.createElement(
            "span"
          );

        languageEl.className =
          "code-language";

        languageEl.textContent =
          language ||
          "code";


        const copyButton =
          document.createElement(
            "button"
          );

        copyButton.type =
          "button";

        copyButton.className =
          "copy-code-btn";

        copyButton.textContent =
          "Copy";


        copyButton.addEventListener(
          "click",
          async () => {

            const codeText =
              code.textContent || "";

            const success =
              await copyToClipboard(
                codeText
              );


            copyButton.textContent =
              success
                ? "Copied!"
                : "Gagal";


            setTimeout(
              () => {

                copyButton.textContent =
                  "Copy";

              },
              1400
            );

          }
        );


        header.appendChild(
          languageEl
        );

        header.appendChild(
          copyButton
        );


        pre.parentNode.insertBefore(
          wrapper,
          pre
        );


        wrapper.appendChild(
          header
        );

        wrapper.appendChild(
          pre
        );

      });

  }


  function getCodeLanguage(
    code
  ) {

    const classes =
      Array.from(
        code.classList
      );


    const languageClass =
      classes.find(
        name =>
          name.startsWith(
            "language-"
          ) ||
          name.startsWith(
            "lang-"
          )
      );


    if (!languageClass) {
      return "";
    }


    return languageClass
      .replace(
        /^language-/,
        ""
      )
      .replace(
        /^lang-/,
        ""
      )
      .toLowerCase();

  }


  /* ==========================================================
     MESSAGE COPY
     ========================================================== */

  function addMessageActions(
    messageElement,
    content,
    role = "assistant",
    messageIndex = -1
  ) {
    const body = messageElement.querySelector(".message-body");
    if (!body) return;

    const oldActions = body.querySelector(".message-actions");
    if (oldActions) oldActions.remove();

    const actions = document.createElement("div");
    actions.className = "message-actions";

    if (role === "assistant") {
      const regenerateButton = document.createElement("button");
      regenerateButton.type = "button";
      regenerateButton.textContent = "↻ Regenerate";
      regenerateButton.addEventListener("click", () => regenerateResponse(messageIndex));
      actions.appendChild(regenerateButton);
    }

    if (role === "user") {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "✎ Edit";
      editButton.addEventListener("click", () => editMessage(messageIndex));
      actions.appendChild(editButton);
    }

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.innerHTML = "⧉ Copy";
    copyButton.addEventListener("click", async () => {
      const success = await copyToClipboard(content);
      copyButton.textContent = success ? "✓ Copied" : "Gagal";
      setTimeout(() => {
        copyButton.innerHTML = "⧉ Copy";
      }, 1400);
    });
    actions.appendChild(copyButton);
    body.appendChild(actions);
  }

  async function regenerateResponse(messageIndex) {
    if (isGenerating) return;
    const chat = getCurrentChat();
    const message = chat?.messages?.[messageIndex];
    if (!chat || !message || message.role !== "assistant") return;
    chat.messages = chat.messages.slice(0, messageIndex);
    chat.updatedAt = Date.now();
    saveChats();
    renderHistory();
    renderCurrentChat();
    await requestAI(chat);
  }

  function editMessage(messageIndex) {
    if (isGenerating) return;
    const chat = getCurrentChat();
    const message = chat?.messages?.[messageIndex];
    if (!chat || !message || message.role !== "user") return;
    input.value = message.content || "";
    chat.messages = chat.messages.slice(0, messageIndex);
    chat.updatedAt = Date.now();
    saveChats();
    renderHistory();
    renderCurrentChat();
    resizeTextarea();
    updateSendButton();
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function formatMessageTime(timestamp) {
    if (!timestamp) return "";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(timestamp));
    } catch (_) {
      return "";
    }
  }

  function buildContextMessages(messages) {
    if (!Array.isArray(messages) || !messages.length) return [];
    const total = messages.reduce(
      (sum, message) => sum + String(message?.content || "").length,
      0
    );
    if (total <= MAX_CONTEXT_CHARS) return messages;

    const selected = [];
    let used = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const size = String(message?.content || "").length;
      if (selected.length && used + size > MAX_CONTEXT_CHARS) break;
      selected.push(message);
      used += size;
    }

    const first = messages[0];
    if (first && !selected.includes(first)) {
      while (selected.length && used + String(first.content || "").length > MAX_CONTEXT_CHARS) {
        const removed = selected.shift();
        used -= String(removed?.content || "").length;
      }
      if (used + String(first.content || "").length <= MAX_CONTEXT_CHARS) {
        selected.unshift(first);
      }
    }

    return selected.reverse();
  }

  function getChatText(chat) {
    return (chat?.messages || [])
      .filter(message => message?.role === "user" || message?.role === "assistant")
      .map(message => `${message.role === "user" ? "You" : "AI Mr Ferdy"}: ${message.content || ""}`)
      .join("\n\n");
  }

  async function copyCurrentChat() {
    const chat = getCurrentChat();
    if (!chat?.messages?.length) return;
    const success = await copyToClipboard(getChatText(chat));
    if (!copyChatBtn) return;
    const old = copyChatBtn.textContent;
    copyChatBtn.textContent = success ? "✓ Copied" : "Gagal";
    setTimeout(() => {
      copyChatBtn.textContent = old || "Copy";
    }, 1400);
  }

  function exportCurrentChat() {
    const chat = getCurrentChat();
    if (!chat?.messages?.length) return;
    const text = `${chat.title || "Chat baru"}\n${"=".repeat(40)}\n\n${getChatText(chat)}`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(chat.title || "chat-baru").replace(/[^a-z0-9-_]+/gi, "-").slice(0, 60) || "chat-baru"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function copyToClipboard(
    text
  ) {

    try {

      await navigator.clipboard.writeText(
        text
      );

      return true;

    } catch (_) {

      try {

        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          text;

        textarea.style.position =
          "fixed";

        textarea.style.opacity =
          "0";

        document.body.appendChild(
          textarea
        );

        textarea.select();

        const success =
          document.execCommand(
            "copy"
          );

        textarea.remove();

        return success;

      } catch (_) {

        return false;

      }

    }

  }


  /* ==========================================================
     AUTO TITLE
     ========================================================== */

  function createTitleFromMessage(text) {
    let clean = String(text || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/https?:\/\/\S+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    clean = clean.replace(/^(tolong|mohon|bantu|bisa|bisakah|coba|buatkan|buat|jelaskan|terangkan|kasih|berikan)\b[,:\s-]*/i, "").trim();
    if (!clean) clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return "Chat baru";
    const words = clean.split(" ");
    if (words.length > 8) clean = words.slice(0, 8).join(" ");
    return clean.length <= 55 ? clean : clean.slice(0, 55).trim().replace(/[.,;:!?-]+$/, "") + "…";
  }


  /* ==========================================================
     TEXTAREA
     ========================================================== */

  function resizeTextarea() {

    if (!input) {
      return;
    }

    input.style.height =
      "auto";


    const height =
      Math.min(
        input.scrollHeight,
        200
      );


    input.style.height =
      `${height}px`;

  }


  /* ==========================================================
     SEND BUTTON
     ========================================================== */

  function updateSendButton() {

    if (!sendBtn) {
      return;
    }


    if (isGenerating) {
      sendBtn.disabled = false;

      return;
    }


    sendBtn.disabled =
      !input.value.trim();

  }


  function setGeneratingState(
    generating
  ) {

    if (!sendBtn) {
      return;
    }


    if (generating) {

      sendBtn.disabled =
        false;

      sendIcon.style.display =
        "none";

      stopIcon.style.display =
        "block";

      sendBtn.setAttribute(
        "aria-label",
        "Stop response"
      );

    } else {

      sendIcon.style.display =
        "";

      stopIcon.style.display =
        "none";

      sendBtn.setAttribute(
        "aria-label",
        "Kirim pesan"
      );

      updateSendButton();

    }

  }


  /* ==========================================================
     STOP GENERATION
     ========================================================== */

  function stopGeneration() {

    if (
      abortController
    ) {

      abortController.abort();

      abortController = null;

    }

    isGenerating = false;

    setGeneratingState(false);

  }


  sendBtn?.addEventListener(
    "click",
    event => {

      if (isGenerating) {

        event.preventDefault();

        stopGeneration();

      }

    }
  );


  /* ==========================================================
     SCROLL
     ========================================================== */

  function scrollToBottom(
    smooth = true,
    force = true
  ) {
    if (!chatScroll) return;
    if (!force && userScrolledUp) return;
    requestAnimationFrame(() => {
      chatScroll.scrollTo({
        top: chatScroll.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
      userScrolledUp = false;
      updateScrollButton();
    });
  }

  function updateScrollButton() {
    if (!chatScroll || !scrollBottomBtn) return;
    const distance = chatScroll.scrollHeight - chatScroll.scrollTop - chatScroll.clientHeight;
    const show = distance > 260;
    scrollBottomBtn.hidden = !show;
    userScrolledUp = show;
  }


  /* ==========================================================
     MOBILE SIDEBAR
     ========================================================== */

  function toggleSidebar() {

    const open =
      sidebar.classList.toggle(
        "open"
      );


    sidebarOverlay.classList.toggle(
      "show",
      open
    );


    mobileMenuBtn.setAttribute(
      "aria-expanded",
      String(open)
    );

  }


  function closeSidebar() {

    sidebar.classList.remove(
      "open"
    );

    sidebarOverlay.classList.remove(
      "show"
    );


    mobileMenuBtn?.setAttribute(
      "aria-expanded",
      "false"
    );

  }


  /* ==========================================================
     START
     ========================================================== */

  init();

})();
