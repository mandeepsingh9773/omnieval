# OmniEval — A Friendly User's Guide

Welcome! This guide explains what OmniEval is, what it does for you, and how to
use it from beginning to end — **no technical background required**.

If someone has given you the web address of an OmniEval installation (for
example, a URL that ends in something like `omnieval.example.com`), then
everything you need is in this document. Open that address in any modern web
browser (Chrome, Edge, Firefox, or Safari) and follow along.

> **Just want the 30-second version?** OmniEval lets you ask **the exact same
> question** to several different AI assistants at the same time, side by side.
> You see all the answers, plus which one was fastest and which one cost the
> least. You can even judge two answers "blind" — without knowing which AI
> wrote which — to remove bias. Then OmniEval keeps a running scoreboard
> ("leaderboard") of how each AI performs over time.

---

## 1. What is OmniEval?

You have probably used AI chat assistants before — tools like ChatGPT, Claude,
or Gemini. These "chatbots" are powered by AI programs called **models**. Each
company that makes a model (OpenAI, Anthropic, Google, and others) sells several
versions of it, like car manufacturers sell different models of cars.

Choosing which model is right for **your** needs is genuinely hard:

- The companies' own advertisements all claim theirs is the best.
- Public "benchmark" tests use generic questions that may have nothing to do
  with what **you** actually want to ask.
- Testing models yourself, one at a time, in different tabs, is slow and
  unreliable — you forget which answer came from which model, and you tend to
  be biased by the brand name.

**OmniEval solves this.** It is a clean, simple web page that:

1. Lets you **run one question across up to four different models at the same
   time**, so they all see the identical question under identical conditions.
2. Shows you each answer **as it's being typed**, so you watch the models work
   in real time.
3. Measures practical things you actually care about: **how fast** each model
   starts answering, **how fast** it types the whole answer, and **how much it
   costs** in real money.
4. Offers a **"blind battle"** mode, where two models answer your question but
   you **don't know which is which** until after you've picked the better
   answer. This removes any brand bias — you judge purely on the quality of the
   words you see.
5. Keeps a running **leaderboard** (a score ranking, like a chess ranking) of
   how the models stack up as you judge more battles.

A key part of the design: **your own personal API keys are used to power these
AIs, and they never leave your browser.** This is explained in plain language
in Section 5.

---

## 2. A simple way to think about it

Imagine you are trying to decide which chef to hire for a dinner party. Three
friends recommend different restaurants, but you want to judge the chefs
yourself on the dish you'll actually serve.

Here is how OmniEval is like a **"cooking-off"**:

- **You pick the recipe** (your question/prompt).
- **You line up the chefs** (the AI models) — up to four of them.
- **You give every chef the exact same recipe and the exact same ingredients**
  (the same prompt, instructions, and settings) so the comparison is fair.
- **They all cook at the same time** in open kitchens while you watch. You can
  see who gets the first pan on the stove quickly (**speed**), who finishes
  first, and roughly what each chef charges for the meal (**cost**).
- **You taste the dishes** and decide which is best for your party.

And for the "blind battle" part: imagine a **wine-tasting competition where
the bottles are wrapped in brown paper**. You taste two wines and pick the
better one *before* anyone tells you the label or the price. That's far more
honest than picking your favorite brand in advance. OmniEval does exactly that
with AI answers.

---

## 3. When would you use OmniEval?

People use OmniEval in a few common situations:

- **"Which AI should I build my app/website with?"** — If you're creating a
  product that uses AI (a writing tool, a customer-support bot, a study
  helper), you must choose which model company to pay. You can run the exact
  types of questions your app will ask, across several models, and compare
  answer quality, speed, and price before signing a contract.
- **"Should I pay for this AI subscription?"** — You're considering ChatGPT
  Plus, Claude Pro, or Gemini subscriptions. OmniEval helps you see which model
  actually gives better answers to *your* questions, not just the marketing.
- **"Which model is cheapest for the quality I need?"** — A fancy model may
  cost 50 times more than a smaller one while giving nearly identical answers
  for everyday tasks. OmniEval shows you the price difference per question.
- **"Is the newest model worth upgrading to?"** — When a company releases a new
  version, test it head-to-head against the old one you already know.
- **"I want an unbiased second opinion."** — Use the blind battle mode to judge
  answers without being swayed by brand names.

---

## 4. What you need before you start

OmniEval is already hosted and running, so you don't need to install anything.
But you do need two things:

### A. A web browser
Chrome, Edge, Firefox, or Safari — any recent version works.

### B. At least one "API key" from an AI company

This is the part that surprises most first-time users, so let's be upfront
about it.

An **API key** is a long secret code (like a very strong password) that an AI
company gives you so its AI models will work for you. When you use a normal
chatbot like ChatGPT in your browser, the company's own website pays for the AI
on your behalf. OmniEval doesn't work that way: **you supply the key, and the
company bills your account for each question you ask.** The key is your "tap"
into the AI, and it draws from an account you set up.

Three important practical facts:

1. **Each question costs a very small amount of money** — usually well under one
   cent (a fraction of a penny). OmniEval shows you the estimated cost of every
   answer, so you can see exactly what you're spending. For casual testing,
   people typically spend pennies or a few dollars a month. Cheap, fast models
   cost much less than the biggest, smartest ones.
2. **You must add a payment method** (a credit/debit card) at the AI company's
   website to get a key. This is normal and required by the companies. It is
   like loading a prepaid card before you use a vending machine.
3. **You need a separate key for each company you want to test.** Want to
   compare an OpenAI model against an Anthropic model? You need an OpenAI key
   *and* an Anthropic key. Want to test only models from one company? One key
   is enough.

The companies whose models OmniEval supports are:

| Company | Their well-known AI | What you need to do |
| :--- | :--- | :--- |
| **OpenAI** (GPT models) | ChatGPT | Create an account, add a card, create an API key |
| **Anthropic** (Claude models) | Claude | Create an account, add a card, create an API key |
| **Google** (Gemini models) | Gemini | Create an account, add a card, create an API key |
| **Groq** (Llama/Gemma models) | Ultra-fast open models | Create a free account, create an API key |

Section 5 walks you through getting these keys, step by step.

> **A reassuring note on safety:** OmniEval deliberately never sees your keys.
> Your keys are scrambled (encrypted) and stored only inside your own browser.
> They are used only at the moment you ask a question, to connect you directly
> to the AI company. Nobody at OmniEval can read them, and they are never saved
> on OmniEval's servers. See Section 5 for more.

---

## 5. Step-by-step: adding your API keys

### Step 5.1 — Open the key vault

Look in the top-right corner of the screen. You'll see a button that says
**API Keys** with a small number next to it, like **0/4**. That number tells you
how many companies' keys you've added out of the four supported.

Click **API Keys**. A window (a "dialog") opens. It explains the security
promise in three bullet points:
- Your keys are encrypted and stored **only in this browser**.
- They are **never sent to OmniEval servers**, logged, or saved.
- They are used **directly with the AI company** when you run a question.

### Step 5.2 — Create a key at the AI company's website

The key-vault window has four tabs at the top: **OpenAI**, **Anthropic**,
**Google Gemini**, and **Groq**. Each tab shows a short instruction and a
"Get a key" link that takes you to the right page on that company's site.

Here's what to do at each company (click the underlined "Get a key" link inside
the app to jump straight there):

- **OpenAI** (go to `platform.openai.com/api-keys`):
  1. Sign in or create an account.
  2. Go to **Billing** and add a payment method (this is where you pre-pay /
     add a card). For light testing, OpenAI has a "Set a limit" option so you
     can cap your spending.
  3. Open **API keys** and click **Create new secret key**. Give it any name
     (e.g. "OmniEval"), then copy the key that appears. It looks like
     `sk-...` followed by many random letters.
- **Anthropic** (go to `console.anthropic.com/settings/keys`):
  1. Sign in or create an account.
  2. Add a payment method under **Billing** (and note your free credit, if any,
     can run out).
  3. On the **API keys** page, click **Create Key**, name it, and copy it. It
     looks like `sk-ant-...`.
- **Google Gemini** (go to `aistudio.google.com/app/apikey`):
  1. Sign in with a Google account.
  2. Click **Create API key** and pick a project (create one if asked).
  3. Copy the key — it looks like `AIza...`.
  4. Note: Google's Gemini free tier can be used without a card at first, but
     the faster/larger models require billing. If your runs start failing with
     a "quota" message, that's the sign to enable billing.
- **Groq** (go to `console.groq.com/keys`):
  1. Create a free account (sign in with Google or GitHub).
  2. Open **API Keys** and click **Create API Key**. Copy it — it looks like
     `gsk_...`.
  3. Groq offers generous free usage for most models, so this is a great first
     key to try.

**Treat these keys like passwords.** Anyone who gets hold of one can spend your
money. If you ever suspect a key leaked, delete it at the company's website and
create a new one.

### Step 5.3 — Paste and validate the key

1. Click the tab for the company (e.g., **OpenAI**).
2. Paste the key into the box. The box hides what you typed (shown as dots) so
   nobody looking over your shoulder can read it — you can click the little eye
   icon to peek and check you pasted it correctly.
3. Click **Save & Validate**.

OmniEval will contact that company to confirm the key works, and then show one
of three messages:

| Message you may see | What it means |
| :--- | :--- |
| **Key validated** | Success. The key is active and the AI company accepted it. You're ready to go. |
| **Invalid key** | The company rejected the key. Double-check you copied it fully (keys are long — easy to miss a character) and that you're pasting it into the correct company's tab. |
| **Could not validate** | OmniEval couldn't reach the company to check (often a network restriction). The key was still saved. Don't worry — it will be tested automatically the first time you run a question, so just proceed. |

Once a key is saved, you'll see a green **"Configured"** badge and a masked
version of the key (like `sk-...abcd`) so you can tell it's there without
revealing it.

### Step 5.4 — Repeat for any other companies you want

There's no rule about how many to add. Some tips:

- Add **at least two** companies' keys if you want to use the blind-battle
  "Arena Mode" (it needs at least two models, and ideally models from different
  companies, to choose from).
- Add keys only for companies you're genuinely considering. Unused keys are
  harmless, but keeping just the ones you need is tidier.

### Step 5.5 — Replace or remove a key

- **To replace:** paste the new key over the old one and click **Save &
  Validate**.
- **To remove:** click the small trash-can icon next to the key.

When you're done, click anywhere outside the window or press the **Esc** key to
close it. The **API Keys** button now shows how many you've added (e.g. **2/4**).

### What "encrypted in this browser" actually means

When you save a key, OmniEval scrambles it using the same kind of strong
encryption banks use (AES), and stores the scrambled version in your browser's
local storage on your own computer. It cannot be unscrambled by OmniEval, by
anyone who runs the OmniEval servers, or by anyone who copies OmniEval's data —
the scrambling key is derived from a secret that only your browser session
knows. Only when you click "Run" is the key briefly unscrambled in your
computer's memory, used to speak to the AI company for that one question, and
then it stays local. This "bring your own key" approach is the whole point of
OmniEval — your keys and your data stay yours.

---

## 6. The two modes, at a glance

OmniEval has two screens, and a button in the top-right corner switches between
them:

- **Home (called "Model Arena" — benchmarking):** the main screen. You choose
  the exact models (up to four, by name) that compete on your question. This is
  your everyday comparison tool. There's also a small "Arena Mode" button in
  the header that jumps to the blind-battle screen.
- **Arena Mode (blind battles + leaderboard):** the "mystery" screen. OmniEval
  picks two random models from the companies whose keys you've added, they both
  answer your question anonymously, you judge the better answer, and then the
  two models are revealed and the leaderboard updates. A "Home" button in the
  header brings you back.

The rest of this guide walks through both screens in order.

---

## 7. Model Arena — your first comparison

This is the main screen you land on. It's where you run the same question
across up to four named models side by side.

### 7.1 Meet the screen

From top to bottom, you'll see:

- The **OmniEval** header (with the API Keys button and theme toggle).
- The headline **"Benchmark models. Keep your keys."** and a short description.
- A section titled **Model Arena** containing:
  - **One white card with an "X"** — this is a *model panel*, one per model.
    By default there's one panel.
  - Above the panels, a **Results** label with a count like **1/4**, and an
    **Export** button (see Section 10).
- A section titled **Model Arena** describing the controls (this is described
  in 7.2).
- A right-hand card titled **Bring Your Own Key** showing which companies are
  ready (green "Ready") vs. not configured.

> If you haven't added any keys yet, OmniEval shows a friendly empty-state card
> instead: **"No API keys configured yet"** with a **Configure API keys**
> button. Go do Section 5 first, then come back.

### 7.2 The control panel (your "question setup")

At the top you'll see a boxed area with several controls. Let's go through each
one, left to right / top to bottom.

**Prompt** — *the question you want every model to answer.* This is the main
text box. Type anything: "Write a short email asking for a day off," "Explain
quantum physics to a 10-year-old," "Fix the grammar in this paragraph: …".
The models will all answer this *exact* question.

**System prompt (optional)** — *personality and ground rules for the models.*
You can leave this empty and the models will just answer naturally. If you fill
it in, every model receives it as a "stage direction" before answering. For
example, typing *"You are a precise, terse assistant."* tells all the models to
answer briefly and factually. **When to use it:** when you want to compare
models under a specific persona or format — e.g., "You are a cheerful children's
tutor," or "Always respond with a numbered list." Because every model gets the
same system prompt, the comparison stays fair.

**Temperature** — *how "creative" vs. "careful" the answers are.* This is a
slider from **0 to 2** (the default is **0.70**).

- A low value (near **0**) makes a model predictable, factual, and "on rails."
- A high value (near **2**) makes it more creative and imaginative, but also
  more likely to ramble or make things up.
- **When to change it:** if you're testing factual tasks (summaries, code,
  translations), set it low (e.g., 0 to 0.3) so all models behave consistently
  and you're comparing knowledge, not creativity. If you're testing creative
  writing or brainstorming, raise it. For a fair comparison, just keep it at
  the same value for every model (which OmniEval guarantees).

**Max tokens** — *the longest answer a model is allowed to give.* A "token" is
roughly a small piece of a word (about three-quarters of a word on average). So
2,048 tokens ≈ a few pages of text. This slider runs from 128 to 8,192 (default
**2,048**). **When to change it:** raise it if you expect long answers (an
essay, code file); lower it to save money if you only need short answers.
Think of it as the maximum essay length you're willing to accept.

**Run all models** — the big button that starts everything. It's greyed out
until you've typed a prompt. Once clicked, all the models begin answering at
once, live on screen. (Keyboard shortcut: press **Ctrl** (Windows) or **Cmd**
(Mac) together with **Enter** while in the prompt box.)

**Stop** — appears only while answers are streaming. Click it to halt all the
models mid-answer if you've seen enough.

**Add model** — opens a list of every other available model, organized by
company. Click one to add its panel. You can have up to **four** panels total.
The button shows your current count, e.g. **2/4**. If a model is already in the
grid, it won't appear in the list again (no duplicates).

### 7.3 Choosing which models compete

Each **model panel** (the white card) has two dropdowns at its top:

- **A company dropdown** (left, color-coded): OpenAI, Anthropic, Google
  Gemini, or Groq. Only companies whose key you've added are usable.
- **A model dropdown** (right): the specific models that company offers. The
  names look technical (like `gpt-4o` or `claude-3-7-sonnet`); these are the
  official model names. Here's a friendly translation of the defaults:

| Company | Default model name you'll see | The friendly way to think of it |
| :--- | :--- | :--- |
| OpenAI | `gpt-4o` | OpenAI's all-round flagship |
| Anthropic | `claude-3-7-sonnet` | Claude's strong all-round model |
| Google Gemini | `gemini-2.5-pro` | Gemini's big thinking model |
| Groq | `llama-3.3-70b-versatile` | A very fast, cheap open model |

If a panel's company doesn't have a key yet, running it will show a friendly
error telling you to add the key. Fix it in the API Keys window and run again.

**Practical tip for choosing a first test:**
- If you added OpenAI + Anthropic keys, compare `gpt-4o` vs `claude-3-7-sonnet`
  — the two big-name rivals — to see which you personally prefer.
- Add a second panel (via **Add model**) with `gpt-4o-mini` (OpenAI's cheaper
  model) to see how much quality you'd lose by saving money.
- Add a Groq model like `llama-3.1-8b-instant` to see an ultra-cheap, ultra-fast
  option.

Each panel also has two small buttons on its top row:
- **Copy icon** — copies that model's full answer to your clipboard, so you can
  paste it elsewhere.
- **X (remove) icon** — removes that panel (only shown when there are 2+ panels,
  so you can't remove them all).

### 7.4 Running your first comparison

1. Type your question into the **Prompt** box. Example:
   *"Write a two-sentence apology email to a client for a late delivery."*
2. (Optional) Type a **System prompt** if you want a persona.
3. (Optional) Adjust **Temperature** and **Max tokens**.
4. Add models with **Add model** until you have the lineup you want (up to 4).
5. Click **Run all models**.

Now watch. Each panel will show a status badge as it works:

| Badge | What it means |
| :--- | :--- |
| **Idle** | Ready and waiting — hasn't run yet. |
| **Streaming** | The model is typing its answer right now (this is live). |
| **Completed** | The model has finished answering. |
| **Error** | Something went wrong for this model (see Section 11 for fixes). |

While streaming, you'll first see "Waiting for first token…" with a shimmering
placeholder, then the answer appears word by word in real time, exactly like a
chatbot typing. This live effect is useful — you can see that some models start
typing almost instantly while others pause to "think" first.

The **Results** label above the panels counts your panels (e.g., **2/4**).
Below each completed answer you'll see a row of small metric chips — those are
explained in Section 8.

When every model has finished (all badges read **Completed**), you're looking
at your comparison: all four answers to the identical question, side by side,
with their speed and cost numbers underneath.

---

## 8. Understanding your results

Underneath each answer, OmniEval displays six small boxes ("metric chips").
Here is what each one means in plain English:

| Chip label | What it really means | Good or bad? |
| :--- | :--- | :--- |
| **TTFT** (Time To First Token) | How long the model made you wait before its *first word* appeared. (Think: "engine start time.") | **Lower is better.** Under a second is excellent. |
| **Speed** (measured in "tok/s") | How many tokens (pieces of words) the model typed *per second* once it got going. (Think: "typing speed.") | **Higher is better.** 20+ tok/s feels fast and smooth. |
| **Total** | The complete time from clicking Run until the answer finished. | **Lower is better.** Includes both the start-up wait and the typing time. |
| **Tokens** (shown as in/out, e.g. `12/86`) | The size of the exchange. The number on the left is how many tokens your *question* used (the "input"). The number on the right is how many tokens the *answer* used (the "output"). Roughly, 1 token ≈ ¾ of a word. | Just information. Bigger output = longer answer = (usually) more cost. |
| **Cost** | An *estimated* price in US dollars for this one answer, based on the company's public price list. Often shown as a tiny figure like `$0.0003`. | Lower is better, obviously — but weigh it against answer quality. |
| **Reason** | Why the model stopped writing. You'll usually see **stop** (it finished naturally). Other possibilities: **length** (it hit your Max tokens ceiling and was cut off — raise Max tokens if you see this), or **tool-calls** / **content-filter** type messages. | Read it only if something looks cut off. |

### The "Latency comparison" charts

Further down the page (once at least one model has run) is a card titled
**Latency comparison** with two simple bar charts:

- **Time to first token** — one bar per model. Shorter bars are better. This
  tells you who starts talking first.
- **Generation speed** — one bar per model, measured in tokens/second. Taller
  bars are better. This tells you who types fastest once started.

Bars are colored by company (OpenAI, Anthropic, Gemini, Groq — a small legend
under the chart shows which color is which). Hover over a bar to see the model's
full name. Use these charts for a quick visual "who's quickest" glance without
reading every number.

### So… which model "won"?

There is no single right answer — it depends on what you care about:

- **Best answer quality:** read the four answers carefully (or better yet, test
  in Arena Mode, Section 9, to judge without brand bias).
- **Fastest:** look at the charts — the shortest "time to first token" is the
  most responsive; the tallest "generation speed" finishes typing fastest.
- **Cheapest:** compare the Cost chips. Expect the small/cheap models to cost a
  tiny fraction of the flagship ones.
- **Best value:** the sweet spot where quality is good enough and cost/speed
  are reasonable. Often the cheap "mini"/"flash" models win this for everyday
  tasks, while the big models win for hard reasoning or nuanced writing.

A common pattern to expect: the biggest, smartest models are the slowest to
start (they "think" first) and the most expensive, but give the most thoughtful
answers — while smaller models answer instantly and nearly free but with less
depth. OmniEval makes that trade-off visible instead of forcing you to guess.

---

## 9. Arena Mode — blind battles and the leaderboard

Click **Arena Mode** in the top-right corner. This screen lets you judge two
model answers *without knowing which model wrote which* — the "brown paper
over the wine bottle" idea. It also maintains the leaderboard.

### 9.1 Why "blind"?

If you know an answer came from a famous, expensive model, you're likely to
rate it higher without really reading it (and the reverse for unknown models).
OmniEval hides the identities until after you vote, so your judgment is purely
about the quality of the words on the screen. This is the same trick used by
researchers and by "chatbot arenas" that rank AI models fairly.

### 9.2 Start a blind battle

1. The screen looks similar to the Home screen: a **Prompt** box, an optional
   **System prompt**, and the **Temperature** / **Max tokens** sliders (all
   identical to Section 7.2).
2. Type your question.
3. Click **Start blind battle**.

OmniEval then secretly picks **two random models** from the companies whose
keys you've added. You can't choose which two — that randomness is what makes
the rankings fair over time (every model eventually fights every other model).
A small note at the bottom says: *"Two random models from your configured keys
· hidden until you vote."*

Two panels labeled **Model A** and **Model B** appear. Each shows a **Hidden**
badge in its corner, and their answers stream in live — exactly like the model
panels, but with the model names and all speed/cost numbers concealed, so
nothing influences your judgment.

> **Need two companies first?** If you've added fewer than two providers' keys,
> OmniEval shows a card: *"Configure at least two provider keys."* Go back to
> the API Keys window (Section 5) and add another company's key, then return.

### 9.3 Voting — who's better?

Once both models finish answering (both panels show their full text and the
message *"Vote to reveal the model and its metrics"*), a voting card appears:
**"Which response is better?"** with four buttons:

| Button | Use it when… |
| :--- | :--- |
| **Model A is Better** | The left answer was more helpful, accurate, or well-written. |
| **Model B is Better** | The right answer was. |
| **Tie** | They're equally good (or equally flawed, but in a similar way). |
| **Both are Bad** | Both answers were wrong, useless, or off-topic — rate them both down. |

Read both answers fully before voting — that's the whole point of the exercise.

### 9.4 The reveal

After you vote, the masks come off:

- The winner is announced with a banner — e.g., a trophy badge reading
  **"Model A wins this round"** (or **"It's a tie"**, or **"Both responses were
  rated bad"**).
- Each panel now shows which company and model it actually was (a color-coded
  company badge plus the technical model name), along with its previously
  hidden **TTFT, latency, cost, and tokens** — the same metrics from Section 8.
- Each panel also shows an **Elo** chip — e.g. **+12** next to a number like
  **1512 elo**. This is the model's score changing because of your vote.

### 9.5 What is "Elo"?

Elo (pronounced *ee-low*) is a **ranking system borrowed from chess**. Every
model starts at **1500 points**. After each battle:

- The winner **gains** points; the loser **loses** the same amount.
- Beating a strong opponent (high Elo) earns **more** points than beating a
  weak one.
- Losing to a weak opponent costs more points than losing to a strong one.
- A **Tie** or **Both are Bad** counts as a draw: both models' scores barely
  move.

The +/− number on each revealed panel is exactly how many points that model just
gained or lost because of your vote. Over many battles, the models settle into
a fair ranking — the best performer for your kinds of questions rises to the
top, regardless of marketing.

**Important:** these votes and ratings are shared and saved on OmniEval's
server, so the leaderboard reflects the combined judgment of **everyone using
this OmniEval installation** — not just your browser. If you clear your browser
data, the leaderboard is unaffected. (Your API keys are the only thing stored
only in *your* browser.)

### 9.6 Other buttons on this screen

- **Stop** — halts both models mid-answer (shown only while they're typing).
- **New battle** — clears the current result so you can run another battle,
  either with a new question or the same one (great for gathering more votes on
  one prompt).
- If a battle fails (a model errors out), you'll see a **"Battle aborted"**
  message. Click **New battle** to try again — the problem is usually one
  provider being temporarily slow or over quota.

---

## 10. The Leaderboard

Below the battle area is a card titled **Leaderboard**. This is the running
ranking of all models that have been judged in battles. Its columns mean:

| Column | What it means |
| :--- | :--- |
| **Rank** | The model's current position (1 = best). |
| **Model** | The company badge + the model's name. |
| **Elo** | Its chess-style score (starts at 1500; higher = ranked better). |
| **Win rate** | The percentage of its battles that it won (a "Tie"/"Both bad" counts as not-a-win). |
| **W–L–D** | Its full record, e.g. **8–3–2** = 8 wins, 3 losses, 2 draws. |
| **Battles** | Total number of battles this model has been in. Treat ratings from very few battles with skepticism. |

The number badge in the card's top corner (e.g. **4 models**) is just the count
of models that have at least one battle. A **Refresh** button at the bottom
reloads the latest rankings.

**Reading the leaderboard wisely:** a model ranked #1 after only 2 battles isn't
meaningful — rankings become trustworthy as the **Battles** column grows. Also,
the leaderboard reflects whatever questions everyone has been asking, so it's
most meaningful if the community uses it for similar tasks. For a verdict on
*your* question, judge the battles yourself in Section 9.

---

## 11. Saving your work (Export)

Back on the Home screen, after at least one model has completed a run, the
**Export** button (top-right of the Results area) becomes active. Click it to
download a record of the whole session — your question, settings, and every
model's answer plus its metrics. It offers three formats:

- **Markdown (`.md`)** — a clean, readable text document that opens in any text
  editor and in most note-taking apps. **Use this if you just want to keep or
  share a nicely formatted copy.**
- **CSV (`.csv`)** — a spreadsheet-style file that opens in Excel, Google
  Sheets, or Numbers, with one row per model. **Use this if you want to sort,
  filter, or chart the numbers yourself.**
- **JSON (`.json`)** — a machine-readable file. **Only use this if you're a
  developer** who wants to feed the results into a program. Ignore it otherwise.

**A note on saving:** ordinary Model Arena comparisons are shown on screen and
can be exported, but are *not* saved to OmniEval's history automatically — so
if you want to keep a comparison, download it with Export while it's on screen.
(The one thing that *is* saved automatically is your Arena Mode votes, which
feed the leaderboard.)

---

## 12. Common messages and how to handle them

| Message you might see | What's going on | What to do |
| :--- | :--- | :--- |
| **"No API keys configured yet"** | You haven't added a company key. | Open **API Keys** and follow Section 5. |
| **"[company] key configured. Open API Keys…"** on a panel | The model in this panel belongs to a company whose key isn't added. | Add that company's key, or switch the panel to a company you have a key for. |
| **"Key validated"** / green **Ready** | All good. | Nothing — start testing. |
| **"Invalid key"** | The company rejected the key. | Re-copy the key carefully into the right company's tab, or create a fresh one. |
| **"Could not validate"** | Browser couldn't reach the company to check. | Usually fine — the key gets tested when you run. If your first run errors, double-check the key. |
| **"Rate limited" / "Too many … runs"** | You (or people on your network) sent a burst of requests too quickly. | Wait a minute or two and try again. This protects the shared service. |
| **Run failed / Error badge on one panel** | That specific model/provider had a problem (bad key, temporary outage, the answer timed out, or a request that was too long). | Read the error text on the panel. Common fixes: check the key, shorten the prompt, raise **Max tokens** if it says the answer hit the length limit, or just click **Run all models** again. Other panels are unaffected. |
| **Battle aborted** | One or both mystery models failed during an Arena battle. | Check the error on each panel, then **New battle**. |
| A model keeps showing **"unknown"** for Cost | That model isn't on OmniEval's price list yet, so cost can't be estimated. | Ignore, or check the company's own pricing page for a manual estimate. |
| **Reason: length** | The answer hit your **Max tokens** ceiling and was cut off. | Raise **Max tokens** and re-run. |

If a problem repeats for just one company across all its models, the fault is
usually with that company (check your billing/limits at their site). If it
repeats for every company, check your internet connection or try a different
browser.

---

## 13. Parts that could be confusing — and how we'd improve them

OmniEval is powerful, but several things can puzzle a first-time, non-technical
user. Here's an honest list of the friction points we noticed and concrete ways
the product could be made friendlier.

1. **The jargon barrier.** Words like *API key*, *provider*, *token*, *TTFT*,
   *tok/s*, *Elo*, *system prompt*, *temperature*, and *markdown* appear with
   almost no inline explanation. A non-technical user has to go hunting (or
   read a guide like this one).
   - **Improvement:** add short, plain-language tooltips (a small "?" icon)
     next to every technical label, with a one-sentence everyday explanation
     and "lower/higher is better" hints. Consider renaming "TTFT" to
     "Time to first word", and "tok/s" to "Words per second"-style labels, with
     the technical abbreviation as the small subtitle.

2. **The surprise that it costs real money.** Nothing tells you before you
   start that your API key is a tap into a *billed* account, or that you need a
   payment method at the AI company's website. The "Cost" numbers are estimates
   and some show "unknown", which adds confusion.
   - **Improvement:** a friendly onboarding banner on first use ("Testing
     models uses your own API keys, which bill your account — typical single
     questions cost a fraction of a cent."), a link explaining how to set
     spending limits at each company, and clearer labels on Cost chips (e.g.,
     a small "est." tag and a note when the price list is out of date).

3. **Cryptic counts like "0/4" and "2/4".** The API Keys button's badge and the
   "Results 2/4" counter aren't self-explanatory.
   - **Improvement:** spell them out ("2 of 4 companies configured") or use a
     checkmark list instead of raw fractions.

4. **The model names look like serial numbers.** `claude-3-7-sonnet`,
   `gemini-2.5-pro`, `gpt-4o` mean nothing to most people.
   - **Improvement:** show friendly names with the technical ID underneath
     (e.g., "Claude 3.7 Sonnet" with `claude-3-7-sonnet` as the subtitle), plus
     a short hint like "Great all-round model".

5. **"Random" in Arena Mode feels odd.** Users may want to pick the two models
   themselves or understand why they can't.
   - **Improvement:** explain *why* randomness is fair (a one-line note, or a
     small "How this works" link), and offer an optional "choose the two
     fighters" mode for people who want a targeted matchup.

6. **A misleading promise of history.** The home page mentions "Prompt History"
   and stores all this detail, yet ordinary comparisons aren't actually saved —
   you must remember to click Export — while Arena votes *are* saved globally.
   - **Improvement:** either add a "Recent runs" history page for your own
   comparisons, or add a clear note near Export: "Comparisons are not saved
   automatically — download them to keep a record."

7. **Export formats mean nothing to non-developers.** JSON in particular is
   developer-only.
   - **Improvement:** label the menu in plain language ("Download a copy…
     Readable report / Spreadsheet / For developers (JSON)") so people can
     pick without knowing the formats.

8. **No guidance on interpreting results.** First-time users see four answers,
   five numbers per panel, and two charts, with no steer on "so who wins?"
   - **Improvement:** a small collapsible "How to read these results" panel
   and a one-line takeaway under the charts. Possibly a lightweight "verdict"
   highlight (fastest, cheapest, longest) so the data has an entry point.

9. **The underlying "tech talk" leaks in.** Home-page cards and footers show
   phrases like "AES-encrypted", "PromptHistory", "ModelRun", "Elo (K=32)" —
   database and math terms that add noise for a non-technical audience.
   - **Improvement:** keep those details in an "About / for developers" area,
   and use plain words everywhere in the main UI.

None of these stop OmniEval from working — it's a genuinely useful tool as it
stands. But removing this friction would let someone with no AI or software
background go from "opened the URL" to "confidently comparing models" without
needing any outside help.

---

## 14. A quick recap of your first session

1. Open the OmniEval web address in your browser.
2. Click **API Keys** → for each company you want, click its tab, paste your
   key, click **Save & Validate**. (Get keys first from the companies' sites;
   remember they bill your account for usage.)
3. On the **Home** screen, type a **Prompt**, optionally add a **System
   prompt**, adjust **Temperature**/**Max tokens** if you like, pick your models
   (up to 4) with **Add model**, then click **Run all models**.
4. Watch the answers stream in. Read the **metric chips** and the **Latency
   comparison** charts to compare quality, speed, and cost.
5. For an unbiased verdict, click **Arena Mode**, type a question, click
   **Start blind battle**, judge the better answer (Model A / Model B / Tie /
   Both are Bad), and watch the **reveal** update the **Elo** leaderboard.
6. To keep a copy of any comparison, click **Export** and download the
   readable Markdown report (or CSV for a spreadsheet).
7. When a panel errors or messages look alarming, check Section 12 of this
   guide before worrying — most issues are a key to fix, a limit to raise, or
   simply "try again in a moment."

That's everything you need to know. Happy comparing!
