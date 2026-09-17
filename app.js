(function () {
  const loginView = document.getElementById("loginView");
  const dashboardView = document.getElementById("dashboardView");
  const detailView = document.getElementById("detailView");

  const loginForm = document.getElementById("loginForm");
  const loginPassword = document.getElementById("loginPassword");
  const loginError = document.getElementById("loginError");

  const logoutButton = document.getElementById("logoutButton");
  const filterTabs = document.getElementById("filterTabs");
  const postList = document.getElementById("postList");
  const emptyState = document.getElementById("emptyState");

  const backButton = document.getElementById("backButton");
  const saveStatus = document.getElementById("saveStatus");
  const statusBadge = document.getElementById("statusBadge");
  const detailAuthor = document.getElementById("detailAuthor");
  const detailUpdated = document.getElementById("detailUpdated");
  const fieldByline = document.getElementById("fieldByline");
  const fieldTitle = document.getElementById("fieldTitle");
  const fieldImage = document.getElementById("fieldImage");
  const imagePreview = document.getElementById("imagePreview");
  const fieldBody = document.getElementById("fieldBody");
  const saveButton = document.getElementById("saveButton");
  const publishButton = document.getElementById("publishButton");
  const unpublishButton = document.getElementById("unpublishButton");
  const returnButton = document.getElementById("returnButton");
  const actionError = document.getElementById("actionError");

  const returnModal = document.getElementById("returnModal");
  const returnComment = document.getElementById("returnComment");
  const returnCancel = document.getElementById("returnCancel");
  const returnConfirm = document.getElementById("returnConfirm");

  let currentStatusFilter = "";
  let currentPostId = null;

  function showView(view) {
    loginView.hidden = view !== loginView;
    dashboardView.hidden = view !== dashboardView;
    detailView.hidden = view !== detailView;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- auth ----------

  async function checkSession() {
    try {
      const me = await api.me();
      if (me.role !== "editor") throw new Error("not an editor session");
      enterDashboard();
    } catch (e) {
      showView(loginView);
    }
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    try {
      await api.login(loginPassword.value);
      loginPassword.value = "";
      enterDashboard();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.hidden = false;
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    showView(loginView);
  });

  // ---------- dashboard ----------

  function statusLabel(status) {
    switch (status) {
      case "unpublished":
        return "Unpublished";
      case "returned":
        return "Returned";
      case "published":
        return "Published";
      default:
        return status;
    }
  }

  async function enterDashboard() {
    showView(dashboardView);
    await loadPosts();
  }

  async function loadPosts() {
    let posts;
    try {
      posts = await api.listPosts(currentStatusFilter);
    } catch (e) {
      postList.innerHTML = "";
      emptyState.textContent = `Couldn't load posts: ${e.message}`;
      emptyState.hidden = false;
      return;
    }
    postList.innerHTML = "";
    emptyState.textContent = "No posts here.";
    emptyState.hidden = posts.length > 0;

    posts.forEach((post) => {
      const li = document.createElement("li");
      li.className = "post-item";
      li.innerHTML = `
        <div class="post-item-text">
          <h2>${escapeHtml(post.title)}</h2>
          <p class="post-item-meta">
            <span class="status-badge status-${post.status}">${statusLabel(post.status)}</span>
            &middot; by ${escapeHtml(post.byline || post.author)}
            &middot; ${new Date(post.updatedAt).toLocaleString()}
          </p>
        </div>
      `;
      li.addEventListener("click", () => openDetail(post.id));
      postList.appendChild(li);
    });
  }

  filterTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-tab");
    if (!btn) return;
    Array.from(filterTabs.children).forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    currentStatusFilter = btn.dataset.status;
    loadPosts();
  });

  // ---------- detail / edit ----------

  function updateImagePreview() {
    const url = fieldImage.value.trim();
    if (url) {
      imagePreview.src = url;
      imagePreview.hidden = false;
    } else {
      imagePreview.hidden = true;
      imagePreview.src = "";
    }
  }

  fieldImage.addEventListener("input", updateImagePreview);

  function applyButtonVisibility(status) {
    unpublishButton.hidden = status !== "published";
    publishButton.hidden = status === "published";
    returnButton.hidden = status === "published";
  }

  async function openDetail(id) {
    let post;
    try {
      post = await api.getPost(id);
    } catch (e) {
      alert(`Couldn't open that post: ${e.message}`);
      return;
    }
    currentPostId = id;

    statusBadge.textContent = statusLabel(post.status);
    statusBadge.className = `status-badge status-${post.status}`;
    detailAuthor.textContent = post.byline || post.author;
    detailUpdated.textContent = new Date(post.updatedAt).toLocaleString();

    fieldByline.value = post.byline || "";
    fieldTitle.value = post.title || "";
    fieldImage.value = post.image || "";
    fieldBody.value = post.body || "";
    updateImagePreview();

    applyButtonVisibility(post.status);
    actionError.hidden = true;
    saveStatus.textContent = "";

    showView(detailView);
  }

  function currentFieldValues() {
    return {
      byline: fieldByline.value,
      title: fieldTitle.value,
      image: fieldImage.value.trim() || null,
      body: fieldBody.value,
    };
  }

  async function saveChanges() {
    try {
      const updated = await api.updatePost(currentPostId, currentFieldValues());
      saveStatus.textContent = "Saved";
      detailUpdated.textContent = new Date(updated.updatedAt).toLocaleString();
      return updated;
    } catch (err) {
      actionError.textContent = err.message;
      actionError.hidden = false;
      throw err;
    }
  }

  saveButton.addEventListener("click", () => {
    saveChanges();
  });

  backButton.addEventListener("click", () => {
    currentPostId = null;
    showView(dashboardView);
    loadPosts();
  });

  publishButton.addEventListener("click", async () => {
    actionError.hidden = true;
    try {
      await saveChanges();
      const updated = await api.publishPost(currentPostId);
      applyButtonVisibility(updated.status);
      statusBadge.textContent = statusLabel(updated.status);
      statusBadge.className = `status-badge status-${updated.status}`;
      saveStatus.textContent = "Published";
    } catch (err) {
      actionError.textContent = err.message;
      actionError.hidden = false;
    }
  });

  unpublishButton.addEventListener("click", async () => {
    actionError.hidden = true;
    try {
      const updated = await api.unpublishPost(currentPostId);
      applyButtonVisibility(updated.status);
      statusBadge.textContent = statusLabel(updated.status);
      statusBadge.className = `status-badge status-${updated.status}`;
      saveStatus.textContent = "Unpublished";
    } catch (err) {
      actionError.textContent = err.message;
      actionError.hidden = false;
    }
  });

  returnButton.addEventListener("click", () => {
    returnComment.value = "";
    returnModal.hidden = false;
    returnComment.focus();
  });

  returnCancel.addEventListener("click", () => {
    returnModal.hidden = true;
  });

  returnConfirm.addEventListener("click", async () => {
    const comment = returnComment.value.trim();
    if (!comment) {
      returnComment.focus();
      return;
    }
    actionError.hidden = true;
    try {
      await saveChanges();
      const updated = await api.returnPost(currentPostId, comment);
      applyButtonVisibility(updated.status);
      statusBadge.textContent = statusLabel(updated.status);
      statusBadge.className = `status-badge status-${updated.status}`;
      saveStatus.textContent = "Returned to author";
      returnModal.hidden = true;
    } catch (err) {
      returnModal.hidden = true;
      actionError.textContent = err.message;
      actionError.hidden = false;
    }
  });

  // ---------- boot ----------

  checkSession();
})();
