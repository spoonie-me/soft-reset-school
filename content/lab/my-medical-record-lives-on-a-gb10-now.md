---
title: "My medical record lives on a GB10 now"
date: 2026-07-31
description: ""
tags: personal, presence
source: rois.life
slug: my-medical-record-lives-on-a-gb10-now
---

Every doctor I've ever seen keeps a piece of me.

The lab company has my bloodwork. The hospital has my discharge notes. The specialist has the scan. The pharmacy has the list. I have twelve logins and no overview.

That's not a metaphor. I counted.

Twelve years of chronic illness means twelve years of being a stack of files no one has ever read in one sitting. Including me. The fragmentation isn't a side effect of being sick. It's part of the weight. The re-explaining. The records that never sit in the same room. The specialist who asks "so what did the last one say" and I genuinely don't know, because the last one's system doesn't talk to this one's system.

So I built the room myself.

It's called Whole. It's open source. It runs on a little box called a GB10, and it does the thing every hospital and every insurer already does with your data. Pulls it all into one place. Except this time the "one place" is a folder on my own machine, and the only person reading it is me.

Here's what's actually running.

Fasten pulls the records straight from the source. MyChart, the lab company, the hospital portal. You click "Add Source," you log into your own provider the normal way, and it hands your records back to your machine instead of leaving them scattered across twelve companies' servers.

Ollama runs a medical model called MedGemma, entirely local. Nothing about my body leaves the box.

Open WebUI is the chat interface on top of it. I can type "line up my ferritin over the last four years" and get an actual chart, built from records that were sitting in four different portals a year ago.

No subscription. No company in the middle. No cloud account. No one on the other end.

The layperson version needs none of this, by the way. Docker Desktop, two lines in a terminal, done in an afternoon. The GB10 is only for the AI layer on top. You don't need a GPU box to get your whole history in one place. You need one if you want to ask it questions.

I want to be precise about what this is and isn't.

It doesn't diagnose me. It doesn't replace my doctor. It hands me my own history back in a shape I can actually use, so that when I walk into an appointment I'm not starting from zero, and neither is the next doctor.

The data was always being aggregated. Hospitals do it. Insurers do it. Optimized for their goals, not mine. This just moves the finished product to where it belongs. With the patient.

I've spent years explaining what it's like to be seven fragments in seven systems, understood fully by none of them. Building Whole was the first time I got to fix that instead of just describing it.

It's on GitHub: [github.com/spoonie-me/whole](https://github.com/spoonie-me/whole). MIT license. Fork it, run it, make it yours.

If you're the kind of patient who's tired of being a stack of files, this is for you.
