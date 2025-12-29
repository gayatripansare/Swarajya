
/************************************
 * OCR FUNCTION (IMAGE → TEXT)
 ************************************/

async function extractTextFromImage(file) {
  const result = await Tesseract.recognize(
    file,
    "eng",
    {
      logger: info => console.log(info) // progress logs
    }
  );

  return result.data.text;
}

/************************************
 * 0️⃣ TAB SWITCHING
 ************************************/

const tabButtons = document.querySelectorAll(".tab-button");
const imagePanel = document.getElementById("image-panel");
const textPanel = document.getElementById("text-panel");

const imageUploadInput = document.getElementById("image-upload");
const cameraInput = document.getElementById("camera-capture");
const imagePreview = document.getElementById("image-preview");

imagePanel.style.display = "block";
textPanel.style.display = "none";

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    tabButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    if (button.dataset.tab === "image") {
      imagePanel.style.display = "block";
      textPanel.style.display = "none";
    } else {
      imagePanel.style.display = "none";
      textPanel.style.display = "block";
    }
  });
});


/************************************
 * 1️⃣ IMAGE PREVIEW
 ************************************/

function showImagePreview(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    imagePreview.innerHTML = `<img src="${reader.result}" alt="Preview" />`;
  };
  reader.readAsDataURL(file);
}

imageUploadInput.addEventListener("change", e => showImagePreview(e.target.files[0]));
cameraInput.addEventListener("change", e => showImagePreview(e.target.files[0]));


/************************************
 * 2️⃣ ELEMENT REFERENCES
 ************************************/

const ingredientText = document.getElementById("ingredient-text");
const analyzeBtn = document.getElementById("analyze-btn");

const loadingState = document.getElementById("loading-state");
const resultsSection = document.getElementById("results-section");

const intentContent = document.getElementById("intent-content");
const findingsGrid = document.getElementById("findings-grid");
const analysisContent = document.getElementById("analysis-content");
const uncertaintyContent = document.getElementById("uncertainty-content");
const recommendationsContent = document.getElementById("recommendations-content");

const newAnalysisBtn = document.getElementById("new-analysis-btn");
const saveBtn = document.getElementById("save-btn");

let lastResult = null;


/************************************
 * 3️⃣ ANALYZE BUTTON
 ************************************/

analyzeBtn.addEventListener("click", async () => {


  let text = "";
  const isTextMode = textPanel.style.display === "block";

  if (isTextMode) {
    text = ingredientText.value.trim();
    if (!text) {
      alert("Please paste ingredient text first!");
      return;
    }
  } else {
    const hasImage = imageUploadInput.files.length || cameraInput.files.length;
    if (!hasImage) {
      alert("Please upload or capture an image first!");
      return;
    }
    // REAL OCR
const file =
  imageUploadInput.files[0] || cameraInput.files[0];

text = await extractTextFromImage(file);

  }

  loadingState.style.display = "block";
  resultsSection.style.display = "none";

  setTimeout(() => {
    const result = analyzeIngredients(text);
    lastResult = result;
    renderResults(result);
  }, 800);
});


/************************************
 * 4️⃣ ANALYSIS LOGIC (SMART RULE BASED)
 ************************************/

function analyzeIngredients(text) {

  const ingredients = text.split(",").map(i => i.trim()).filter(Boolean);

  let findings = [];
  let harmfulCount = 0;
  let moderateCount = 0;

  ingredients.forEach(item => {
    let level = "Safe";
    let description = "This ingredient is generally considered safe.";

    const lower = item.toLowerCase();

    if (lower.includes("sugar")) {
      level = "Moderate";
      description = "High sugar intake may increase the risk of diabetes and weight gain.";
      moderateCount++;
    }

    if (lower.includes("oil") || lower.includes("palm")) {
      level = "Harmful";
      description = "May contain unhealthy fats that affect heart health.";
      harmfulCount++;
    }

    findings.push({ name: item, level, description });
  });

  // Dynamic Detailed Analysis
  let detailedAnalysis = `This product contains ${ingredients.length} ingredients. `;

  if (harmfulCount > 0) {
    detailedAnalysis += `Some ingredients may pose health risks if consumed frequently. `;
  } else if (moderateCount > 0) {
    detailedAnalysis += `Most ingredients are safe, but moderation is advised. `;
  } else {
    detailedAnalysis += `All listed ingredients are considered safe for general consumption. `;
  }

  detailedAnalysis += `Understanding ingredient composition helps in making healthier food choices.`;

  return {
    intent: "You are evaluating whether this product is safe for regular consumption.",
    findings,
    detailedAnalysis,
    uncertainty: "Exact ingredient quantities and processing levels are not available from the label.",
    recommendations:
      harmfulCount > 0
        ? "Limit frequent consumption and look for healthier alternatives."
        : "This product can be consumed safely as part of a balanced diet."
  };
}


/************************************
 * 5️⃣ RENDER RESULTS
 ************************************/

function renderResults(data) {

  loadingState.style.display = "none";
  resultsSection.style.display = "block";

  intentContent.innerText = data.intent;
  analysisContent.innerText = data.detailedAnalysis;
  uncertaintyContent.innerText = data.uncertainty;
  recommendationsContent.innerText = data.recommendations;

  findingsGrid.innerHTML = "";
  data.findings.forEach(item => {
    const card = document.createElement("div");
    card.className = "finding-card";
    card.innerHTML = `
      <h5>${item.name}</h5>
      <p><strong>Risk:</strong> ${item.level}</p>
      <p>${item.description}</p>
    `;
    findingsGrid.appendChild(card);
  });
}


/************************************
 * 6️⃣ ANALYZE ANOTHER PRODUCT
 ************************************/

newAnalysisBtn.addEventListener("click", () => {
  ingredientText.value = "";
  imageUploadInput.value = "";
  cameraInput.value = "";
  imagePreview.innerHTML = "";

  resultsSection.style.display = "none";
  loadingState.style.display = "none";

  tabButtons.forEach(btn => btn.classList.remove("active"));
  tabButtons[0].classList.add("active");

  imagePanel.style.display = "block";
  textPanel.style.display = "none";

  document.getElementById("analyzer").scrollIntoView({ behavior: "smooth" });
});


/************************************
 * 7️⃣ SAVE RESULTS
 ************************************/

saveBtn.addEventListener("click", () => {
  if (!lastResult) {
    alert("No results to save!");
    return;
  }
  localStorage.setItem("intellifood_result", JSON.stringify(lastResult));
  alert("Results saved successfully!");
});
