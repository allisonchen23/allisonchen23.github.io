---
title: Robustness of Internal Signals for Hallucination Detection in Vision-Language Models
layout: project_page
nav_category: publications
venue: "NeurIPS 2026 · Evaluations & Datasets Track"
affiliation: Princeton University
authors:
  - name: Allison Chen
  - name: William Yang
  - name: Salma Abdel Magid
  - name: Jonathan Williams
  - name: Olga Russakovsky
  - name: Esin Tureci
links:
  - label: Paper
    url: https://arxiv.org/pdf/2610.27041
  - label: Poster
    url: https://drive.google.com/file/d/1pgagZv7oHKYMMEKO5nXirw5HW49SsLWr/view?usp=drive_link
  - label: Code
    url: https://github.com/princetonvisualai/hallucination-detection-robustness
tldr: "Our work analyzes the robustness of hallucination detection methods that use the VLM's internal signals while it generates text. We find that certain methods rely on token position heuristics rather than reliable image signals, revealing important properties that standard evaluation benchmarks conceal."
---

## Abstract

When given an image and a text prompt, vision-language models (VLMs) can produce seemingly sophisticated text responses. However, they are also prone to hallucinate objects in their output, which can have detrimental consequences in safety-critical applications. To detect these hallucinations, certain methods interestingly leverage internal signals from the VLM as it generates the text response; potentially, these methods use the same signals that led to a hallucination to detect it. We conduct an in-depth analysis to understand the robustness of these detection methods. First, we show that a naive baseline of a generated word’s token position in the VLM text response achieves competitive performance. Further, we reveal how some detection methods rely on token position and use this heuristic as a shortcut. Second, we explore detection methods’ sensitivity to language and vision modalities. Our experiments suggest that strong detection performance is often driven by detecting language-based hallucinations, and when methods rely on token position, they tend to be less visually grounded and exhibit reduced robustness when hallucinations occur earlier in a text response. Lastly, we demonstrate that different detection methods can carry complementary signals; when ensembling methods together, adding weaker methods to an ensemble of higher performing ones still offers performance improvements. Altogether, while there may be useful internal VLM signals to detect hallucinations, our investigation reveals important limitations of the current methods that try to leverage them.

## Hallucination Detection Methods Using Internal VLM Signals

The detection methods we analyze leverage a VLM's generation signals as it produces a caption. These methods are computationally efficient because they unlike other approaches, they don't require access to a separate detector model nor requires multiple passes of the VLM.

Signal-based detection methods can be split into two categories: black box methods that compute hallucination detection scores using output logits and white box methods that rely on internal representations or attention patterns.

## Why Standard Evaluations are Insufficient

While many white box methods achieve high performance on standard benchmarks, these evaluations only reveal *how well* methods perform, but not *how* methods make their predictions. Because these methods rely on the same subset of signals that led to the hallucination in the first place, we conduct an in-depth analysis to understand the nature of these signals--whether they are heuristic shortcuts or reliable image-based cues.

---

## Key Finding #1: Token position is a strong heuristic baseline detector and certain methods rely on it.

<!-- Write this section here. -->

## Key Finding #2: Token position reliance can reduce robustness.

<!-- Write this section here. -->

## Key Finding #3: Different methods can carry complementary signals.

<!-- Write this section here. -->

---

## Takeaways

<div class="takeaways" markdown="1">

- &nbsp;
- &nbsp;
- &nbsp;

</div>

## Citation

<div class="bib" markdown="1">
<button class="copy" onclick="copyBibtex(this)">Copy BibTeX</button>

```bibtex
@article{chen2026robustness,
  title   = {Robustness of Internal Signals for Hallucination Detection in Vision-Language Models},
  author  = {Chen, Allison and Yang, William and Abdel Magid, Salma and Williams, Jonathan and Russakovsky, Olga and Tureci, Esin},
  journal = {arXiv preprint arXiv:2610.27041},
  year    = {2026}
}
```

</div>

## Acknowledgements

We would like to thank all those who provided thoughtful feedback and discussion, especially members of the Princeton Visual AI Lab and the anonymous reviewers. We gratefully acknowledge support from the NSF Graduate Research Fellowship Program (A.C., J.W.), Princeton University President’s Fellows (J.W.), Princeton Presidential Postdoctoral Fellowship (S.A.) and from Solidigm AI SW.
