---
title: "The Box Under the Desk"
date: 2026-09-23
description: "Every serious AI deployment in a hospital hits the same wall: where does the data go. A Dell Pro Max with GB10 sitting in a clinic doesn't have that problem."
tags: dell, nvidia, clinical-ai, healthcare, data-privacy, dell-pro-max
source: Soft Reset Lab
slug: the-box-under-the-desk
---

Most hospitals don't have a data privacy problem. They have a data location problem.

Every AI tool a clinic buys today ships patient information somewhere else first. A server in another country. A vendor's cloud. A contract nobody read past page one. The model is smart. The pipeline is the risk.

I spent nine years as a paramedic. Then I spent the next decade being the patient nobody could diagnose. Ten specialists looked at ten years of labs. Not one of them saw the pattern. I saw it myself, from memory, piecing together what happened when. That's not a complaint about any one doctor. That's what happens when the person holding the most complete record of a body is the body itself, and nobody built anything to hold that record for her.

That's the actual problem AI in healthcare should solve. Not chatbots. Not summarizing notes faster. Catching the thing ten fragments never add up to when they live in ten different heads that never talk to each other.

I built a tool to do exactly that.

It runs on a Dell Pro Max with GB10, a DGX Spark-class mini PC that sits under my desk.

Small box. Fits where a laptop charger fits. Runs a full-size model, locally, on-device, nothing leaving the room. I trained it to read patient testimony and flag underreporting. The gap between what a patient says happened and what actually happened. The load a person carries after they've learned that minimizing is what gets you believed.

It won a Dell and NVIDIA competition. More importantly, it worked on cases I recognized. Because I used to be one.

Here's why the box matters, specifically, for a clinic and not just for me.

Every serious AI deployment in a hospital hits the same wall eventually. Where does the data go. Cloud inference means patient records cross a network, sit on someone else's server, get logged somewhere nobody in the building controls. Every privacy officer slows the project down. Correctly. That's their job.

A Dell Pro Max with GB10 sitting in a clinic doesn't have that problem. The model runs on the machine. The data never leaves the building. The compliance conversation gets shorter because the actual risk gets smaller.

Machines have always held information. What they didn't used to hold was the kind of pattern-matching that catches what a rushed intake form misses. Now some of them do. Now you can run that on hardware that fits under a desk instead of a data center.

This isn't a pitch for more AI in healthcare. Most of what gets sold as AI in healthcare is a chatbot wearing a lab coat. This is a pitch for the one piece of infrastructure that changes what a clinic can actually see, without changing who they have to trust with a patient's file.

I'm a Dell Pro Max Ambassador now, which means I get to say this part out loud instead of just building it in a spare room: the hardware conversation and the healthcare conversation are the same conversation. On-device NVIDIA compute isn't a spec sheet detail. It's the reason a hospital's privacy officer can say yes.

If your clinic wants another dashboard, I'm not selling one.

If your clinic wants to catch what its intake process is currently missing, without shipping a single record off-site to do it, that's the conversation worth having.
