# Le nozze di Figaro: how the content was checked

Sources of truth
- Libretto: the 1786 Vienna first print (Kurzbek), read in the Digitale Mozart-Edition critical text (LV_9). Source for the story, stage action, who is on stage.
- Score: Breitkopf & Härtel vocal score, piano reduction by Paul Klengel (Edition Breitkopf 1716, plate 29136; IMSLP #846696). Source for what Mozart set: numbering, kinds of piece, who sings, sung words where they differ from the libretto.

What was checked: the opera's story, 11 cast lines (name, voice type, description), the running order (58 entries: every number and recitative, with who sings, who is on stage without singing, what happens), each character's list of pieces (derived from the running order), 37 act-by-act arcs, the custom piece contexts and "when" lines. About 120 items.

Method
1. Built from the sources: the libretto parsed scene by scene (scripts/libretto/parse_dme.py); the running order written scene by scene against it; numbering, kinds and singers taken from the score's index and pages.
2. Independent review rounds. Each round, fresh reviewers who had not seen the text or earlier findings checked it from three directions:
   - every sentence against the libretto and score;
   - from the sources back to the app (every index entry of the score, all 48 libretto scenes, every character's sung passages);
   - each role read alone, as a singer would (coherence, unexplained references, consistency, language);
   - one round also read who sings from the score's music pages for all 28 numbers and 38 recitatives.
   Findings were classed ERROR / OMISSION (plot-relevant) / MINOR, fixed, and the next round started on the corrected text.
3. Stopping rule: a round with no ERROR and no plot-relevant OMISSION from any reviewer.

Rounds: 1–2 single reviewers (libretto); 3–8 three reviewers each. Round 8 was the first with no errors and no omissions from all three reviewers; its minor points were applied.

Conventions: "on stage" includes people hiding in view (armchair, alcove, garden pavilions), not people shut in the closet; "sings" lists named cast only; kinds use the score's Italian terms (Duetto, Terzetto, Sestetto, Canzona, Coro); voice types are modern casting with the score's original in brackets.

Judgement calls: the Countess listed as hidden on stage in "E perché fosti meco" (she hides in 3.II, no exit is given); Antonio's "drunkenness" given as the others' accusation; Bartolo and Don Curzio in the Act 4 finale follow the score (the libretto does not name them); titles follow the libretto's spelling where the score elides ("In quegli anni", score "In quegl'anni").
