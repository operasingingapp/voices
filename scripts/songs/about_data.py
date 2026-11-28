"""What each song WITHOUT music yet is about, so its page reads like the others (songs with music have theirs in
context_data.py). Written for the app; facts only, no copied translations. Build: python3 scripts/songs/about_data.py
-> src/standalone/songAbout.json"""
import json, os

A = {}
def s(id, year, written, story, poem, music):
    A[id] = dict(year=year, written=written, story=story, poem=poem, music=music)

UNK = "Words by an unknown poet."
PAR = "known from Parisotti's Arie antiche collection (1885-1898)"

# Italian arie antiche
s("caccini-amarilli-mia-bella", "1602", "Published in 1602 in Caccini's Le nuove musiche (Florence)",
  "A lover pleads with Amaryllis: believe that you are my desire. If doubt troubles you, open my heart and you will find her name written there: Amarilli is my love.",
  "Words of uncertain authorship, sometimes attributed to Alessandro Guarini.",
  "An early monody: a free, speech-like line over simple chords, made to be ornamented. Let the words lead, and make each return of 'Amarilli' a little different.")
s("giordani-caro-mio-ben", "c. 1783", "Attributed to Tommaso Giordani (some sources say his brother Giuseppe), around 1783",
  "My dear beloved, believe me at least: without you my heart languishes. Your faithful lover sighs for you always. Stop being so cruel.",
  UNK,
  "Short, simple and in three parts, the song many singers learn first. Keep the long phrases smooth and the breath quiet; the middle part asks for a little more urgency.")
s("caldara-sebben-crudele", "1710", "From Caldara's opera La costanza in amor vince l'inganno (1710)",
  "Though you are cruel and make me suffer, I will always love you faithfully. In time my faithfulness will wear down your cruelty.",
  "Words from the opera's libretto.",
  "A gentle dance in three with a steady pulse. Keep it light and even; the repeated 'sempre fido t'amerò' should stay sweet, not heavy.")
s("caldara-alma-del-core", "1710", "From Caldara's opera La costanza in amor vince l'inganno (1710)",
  "Soul of my heart, spirit of my soul: I will always be constant in adoring you. I will be happy in my torment if I may kiss those lovely eyes.",
  "Words from the opera's libretto.",
  "Graceful, like a minuet, with bright runs on 'contento'. Let them sparkle without pushing.")
s("caldara-come-raggio-di-sol", "early 1700s", f"Attributed to Caldara; {PAR}",
  "As a sunbeam rests calmly on the waves while the sea trembles deep below, so a smiling face may hide a heart in torment.",
  UNK,
  "Very slow, long held lines over repeated chords. A study in legato and breath: keep the tone even as the line climbs.")
s("caldara-selve-amiche", "1710", "From Caldara's opera La costanza in amor vince l'inganno (1710)",
  "Friendly woods, shady trees, faithful keepers of my heart: this soul turns to you, and among you it finds peace.",
  "Words from the opera's libretto.",
  "Calm and pastoral. Long phrases, soft dynamics and an unhurried tempo.")
s("paisiello-nel-cor-piu-non-mi-sento", "1788", "From Paisiello's comic opera L'amor contrastato, known as La molinara (Naples, 1788)",
  "A playful complaint: I no longer feel youth sparkling in my heart. Love pinches me, teases me, torments me, and it is all your fault, Love.",
  "Words by Giuseppe Palomba.",
  "A simple, charming tune that Beethoven and Paganini both used for variations. Keep it light and smiling, with crisp words in the teasing patter.")
s("paisiello-chi-vuol-la-zingarella", "1789", "From Paisiello's comic opera I zingari in fiera (Naples, 1789)",
  "A gypsy girl offers her services: who wants the gypsy girl, clever and pretty? She reads palms, tells fortunes and can charm anyone.",
  "Words by Giuseppe Palomba.",
  "Lively and cheeky. Quick, clear words and a smile in the voice; character matters more than volume.")
s("monteverdi-lasciatemi-morire", "1608", "The only surviving music from Monteverdi's lost opera L'Arianna (Mantua, 1608)",
  "Ariadne, abandoned by Theseus on the island of Naxos: let me die. What could comfort me in so hard a fate, in such great torment?",
  "Words by Ottavio Rinuccini (1562-1621).",
  "A lament built on speech: sighing, falling phrases and bold clashes. Let the words shape the rhythm, and keep 'lasciatemi morire' heavy with grief, never sentimental.")
s("scarlatti-le-violette", "1694", "From Alessandro Scarlatti's opera Pirro e Demetrio (Naples, 1694)",
  "Dewy, fragrant violets, you hide shyly among the leaves and seem to scold my wishes, which reach too high.",
  "Words by Adriano Morselli.",
  "Light, graceful and quick. A good study in clear diction and nimble, even notes.")
s("scarlatti-gia-il-sole-dal-gange", "1680", "From Alessandro Scarlatti's opera L'honestà negli amori (Rome, 1680)",
  "The sun rises from the Ganges, brighter and sparkling. It dries every drop of dew the dawn has wept and gilds every blade of grass.",
  "Words from the opera's libretto.",
  "Bright and energetic, like the sunrise it describes. Keep the rhythm springy and the runs clean.")
s("scarlatti-o-cessate-di-piagarmi", "1683", "From Alessandro Scarlatti's opera Il Pompeo (Rome, 1683)",
  "Stop wounding me, let me die. Cruel eyes, colder than ice to my pain: let me die.",
  "Words by Nicolò Minato.",
  "Slow, grave and in a minor key. The line is simple; the feeling comes from steady legato and the weight of each word.")
s("scarlatti-sento-nel-core", "late 1600s", f"Attributed to Alessandro Scarlatti; {PAR}",
  "I feel a pain in my heart that takes away my peace; a sorrow that tells me I shall die of grief.",
  UNK,
  "Slow and sorrowful. Lean gently into the dissonances on the stressed syllables.")
s("scarlatti-spesso-vibra-per-suo-gioco", "late 1600s", f"Attributed to Alessandro Scarlatti; {PAR}",
  "Love, the boy archer, often shoots his arrows just for fun; but the wounds he leaves are no game.",
  UNK,
  "Quick and playful, with light, bouncing rhythms.")
s("parisotti-se-tu-m-ami-se-sospiri", "1885", "Published by Alessandro Parisotti in Arie antiche (1885) as a work of Pergolesi; it is now thought to be his own",
  "A shepherdess teases her admirer: if you love me and sigh only for me, I am sorry for your pain. But if you think I must love only you, you are fooling yourself. I can love the rose without scorning the lily.",
  "Words by Paolo Rolli (1687-1765).",
  "Flirtatious and light. Let the phrases tilt and smile, and enjoy the change of mood in the middle.")
s("pergolesi-nina", "1749", "Long attributed to Pergolesi; probably by Vincenzo Legrenzio Ciampi (1749)",
  "For three days Nina has stayed in bed. Her desperate admirer calls for fifes, drums and cymbals to wake her from her long sleep.",
  UNK,
  "A slow, mournful tune set to an almost comic text. Sing it straight and tender; the humour takes care of itself.")
s("stradella-pieta-signore", "1800s", "Attributed to Alessandro Stradella, but probably written in the 19th century, perhaps by Louis Niedermeyer or François-Joseph Fétis",
  "A prayer: have mercy, Lord, on me in my sorrow. Do not punish me with all your severity; let your mercy be greater than your judgment.",
  UNK,
  "A grand sacred aria: broad lines and strong contrasts between quiet prayer and fervent outbursts.")
s("durante-danza-danza-fanciulla-gentile", "early 1700s", "Adapted from one of Francesco Durante's solfeggi (singing exercises); the words were added in the 19th century",
  "Dance, dance, lovely girl, while I sing. Turn lightly to the sound of the wind and the murmur of the sea.",
  UNK,
  "A lively, tarantella-like piece with long runs. Keep it buoyant and the runs light; it began as an exercise, so clean, even notes matter.")
s("durante-vergin-tutto-amor", "early 1700s", "Adapted from one of Francesco Durante's solfeggi (singing exercises); the words were added later",
  "Virgin, all love, mother of goodness and mercy: hear, sweet Mary, the one who calls to you in tears. Do not leave his anguish unheard.",
  UNK,
  "Slow, devout and expressive. A study in long, warm legato.")
s("carissimi-vittoria-mio-core", "1600s", "From Carissimi's cantata Amante sciolto d'amore (mid-17th century)",
  "Victory, my heart! Weep no more: love's slavery is broken. The cruel one's deceits have no power over me now.",
  "Words by Domenico Benigni.",
  "Triumphant and quick, with bright runs on 'vittoria'. A firm rhythm and crisp words; let the joy be a little defiant.")
s("marcello-il-mio-bel-foco", "early 1700s", f"Attributed to Benedetto Marcello (1686-1739), though this is doubted; {PAR}",
  "My bright flame, near or far, will never change. The flame that burns in my heart pleases me so much it will never go out.",
  UNK,
  "A recitative, then a lilting aria. Speak the recitative freely, then settle into a steady, graceful line for 'Quella fiamma'.")
s("bononcini-per-la-gloria-d-adorarvi", "1722", "From Giovanni Bononcini's opera Griselda (London, 1722)",
  "For the glory of adoring you I will love you, lovely eyes. Loving you I will suffer, but I will always love you.",
  "Words by Paolo Rolli, after Apostolo Zeno.",
  "Gentle, flowing and lyrical. Keep the phrases long and simple, with a soft swing.")
s("lotti-pur-dicesti-o-bocca-bella", "1714", "From Antonio Lotti's opera Arminio (1714)",
  "At last you said it, lovely mouth: that sweet 'yes' that is all my happiness. Love opened your lips for it.",
  "Words by Antonio Salvi.",
  "Light and joyful, with delicate ornaments. Sing with a smile and keep the trills small and clear.")
s("torelli-tu-lo-sai", "late 1600s", f"Attributed to Giuseppe Torelli (1658-1709); {PAR}",
  "You know how much I loved you, cruel one. I ask for no reward; only remember me, and then despise a faithful heart if you can.",
  UNK,
  "Short, tender and simple. A long, quiet line; let the repeated 'tu lo sai' carry the reproach softly.")
s("gluck-o-del-mio-dolce-ardor", "1770", "From Gluck's opera Paride ed Elena (Vienna, 1770)",
  "Paris, arriving in Sparta, longs for Helen: sweet object of my desire, I breathe the air you breathe. Wherever I look, love paints your face for me.",
  "Words by Ranieri de' Calzabigi.",
  "Noble and yearning, after a long, expressive introduction. Warm phrases and a slow build of longing.")
s("cesti-intorno-all-idol-mio", "1656", "From Cesti's opera Orontea (Innsbruck, 1656)",
  "Queen Orontea watches her beloved as he sleeps: blow gently around my idol, soft breezes, and kiss his cheeks for me.",
  "Words by Giacinto Andrea Cicognini.",
  "A slow, tender lullaby. Soft breath, long phrases and very gentle dynamics.")
s("rosa-star-vicino", "1600s", f"Attributed to Salvator Rosa (1615-1673), painter, poet and musician, though this is doubtful; {PAR}",
  "To be near the one you love is the sweetest delight; to be far away is the greatest torment.",
  UNK,
  "Graceful and lilting. Keep it light, with clean leaps and an easy swing.")
s("gasparini-caro-laccio", "early 1700s", f"An aria by Francesco Gasparini (1661-1727); {PAR}",
  "Dear bond, sweet knot, how gentle you are to me! You make me happy; I would not want to be set free.",
  UNK,
  "Tender and flowing. Keep the line smooth and the mood content.")
s("legrenzi-che-fiero-costume", "1675", "Attributed to Giovanni Legrenzi, from his opera Eteocle e Polinice (Venice, 1675)",
  "What a cruel habit the winged god of love has: he makes us adore him through harshness. A blindfolded child who makes the strong and wise his slaves.",
  "Words from the opera's libretto.",
  "Quick, rhythmic and a little mocking. Crisp consonants and a steady drive.")
s("handel-lascia-ch-io-pianga", "1711", "From Handel's opera Rinaldo (London, 1711); he had used the melody before, in Almira (1705)",
  "Almirena, held prisoner in a magic garden, begs: let me weep over my cruel fate and long for freedom. May sorrow break the chains of my suffering.",
  "Words by Giacomo Rossi.",
  "A slow sarabande. Plain, noble and very still: sing it simply the first time, and add a few tasteful ornaments in the repeat.")

# Italian 19th-century and Neapolitan
s("bellini-vaga-luna-che-inargenti", "1830s", "One of Bellini's chamber songs, published in the 1830s",
  "Lovely moon, silvering these banks and flowers: tell my beloved that I long for her, and that far from her my heart finds no peace.",
  UNK,
  "Long, floating lines over a gentle accompaniment, like a small opera aria. Breathe deep and let each phrase bloom.")
s("bellini-malinconia-ninfa-gentile", "1829", "Published in 1829 in Bellini's Sei ariette",
  "Melancholy, gentle nymph, I give my life to you. Let others keep their noisy pleasures; I seek only you, in the woods and by the springs.",
  "Words by Ippolito Pindemonte (1753-1828).",
  "Gentle and flowing in a calm six. Even, unhurried legato; its shadows are soft, not dark.")
s("bellini-per-pieta-bell-idol-mio", "1829", "Published in 1829 in Bellini's Sei ariette",
  "For pity's sake, my beautiful idol, do not call me unfaithful. It is enough, cruel one, that my fate is faithless and pitiless to me.",
  "Words by Pietro Metastasio (1698-1782).",
  "Elegant and impassioned, with Bellini's long lines. Keep it flowing and let the plea grow.")
s("rossini-la-danza", "1835", "Published in 1835 in Rossini's Soirées musicales",
  "The moon is high over the sea: let's dance! A wild Neapolitan tarantella in which the young people whirl until dawn.",
  "Words by Carlo Pepoli (1796-1881).",
  "A breathless tarantella. Very fast, very clear words: the test is diction and stamina, not volume.")
s("rossini-la-promessa", "1835", "Published in 1835 in Rossini's Soirées musicales",
  "Do not believe, dear eyes, that I could ever stop loving you. Not even in jest could I deceive you.",
  "Words by Pietro Metastasio (1698-1782).",
  "Graceful and gently swinging. Elegant phrasing and light ornaments.")
s("donizetti-me-voglio-fa-na-casa", "1830s", "A Neapolitan song by Donizetti, from the 1830s",
  "I want to build a house in the middle of the sea, of peacock feathers, with golden stairs and windows of jewels; and when my love looks out, people will say the sun is rising.",
  "Words in Neapolitan, by an unknown poet.",
  "Bright and lilting, with a Neapolitan swing. A warm, open voice and a smile.")
s("tosti-l-ultima-canzone", "1905", "Published in 1905",
  "They have told him that tomorrow Nina will marry another. Still he sings her a serenade, his last song to her.",
  "Words by Francesco Cimmino (1862-1939).",
  "A passionate serenade with a great refrain. Sing with full warmth but keep the line: the climax should sound like heartbreak, not shouting.")
s("tosti-a-vucchella", "1907", "Published in 1907",
  "A tender little poem to a girl's mouth, like a small rose a little faded: give me a little kiss.",
  "Words in Neapolitan by Gabriele D'Annunzio (1863-1938).",
  "Light, intimate and teasing. Small dynamics and a smile; keep it conversational.")
s("tosti-malia", "1887", "Published in 1887",
  "What was in the flower you gave me? A potion, a secret power? When you are near, everything changes; it is a spell.",
  "Words by Rocco Emanuele Pagliara (1856-1914).",
  "Warm, intimate and flowing. Let the phrases breathe and grow with the enchantment.")
s("donaudy-vaghissima-sembianza", "1918", "Published in 1918 in Donaudy's 36 Arie di stile antico",
  "Lovely face of a woman once loved: looking at her portrait he sees her as she was, and the old love wakes in him again.",
  "Words by Alberto Donaudy, the composer's brother.",
  "Written in the 'old style' but with a romantic heart: one long, rising melody to a passionate climax.")
s("respighi-nebbie", "1906", "Composed in 1906",
  "Mists rise over the endless grey plain. I suffer, and the bare land seems to suffer with me.",
  "Words by Ada Negri (1870-1945).",
  "Dark and gripping: heavy repeated chords, and a voice that rises from a whisper to a cry. Plan the long crescendo.")
s("di-capua-o-sole-mio", "1898", "Composed in 1898 by Eduardo di Capua (with Alfredo Mazzucchi)",
  "What a beautiful thing a sunny day is. But there is another sun, more beautiful still: my own sun, shining in your face.",
  "Words in Neapolitan by Giovanni Capurro (1859-1920).",
  "The most famous Neapolitan song. Open, ringing tone, but keep it musical: a warm line, not a shout.")
s("de-curtis-torna-a-surriento", "1902", "Composed in 1902 by Ernesto De Curtis",
  "Look at the sea of Sorrento, smell the orange groves; and you say goodbye? Come back to Sorrento, don't let me die.",
  "Words in Neapolitan by Giambattista De Curtis (1860-1926), the composer's brother.",
  "It moves between minor and major as longing and hope change places. Big phrases; let the change of key colour the voice.")
s("verdi-stornello", "1869", "Published in 1869 in an album of songs by several composers",
  "A free-spirited girl answers her lover: you say you don't love me? Fine, nor do I. If you love me, good; if not, also good. I am free, and want to stay free.",
  UNK,
  "A cheeky, rhythmic stornello. A light voice and sharp, playful diction.")

# German
s("schubert-nacht-und-traume", "1823", "Composed around 1823 (D 827); published in 1825",
  "Holy night, you sink down, and dreams float down too, like your moonlight. Come back, holy night; sweet dreams, come back.",
  "Words by Matthäus von Collin (1779-1824).",
  "One of the slowest, quietest songs ever written. The test is a perfectly even, floating legato at a very soft dynamic.")
s("schubert-an-silvia", "1826", "Composed in 1826 (D 891)",
  "Who is Silvia, that all the young men praise her? She is gentle, fair and wise; let us sing of her and bring her garlands.",
  "Words by Eduard von Bauernfeld, after Shakespeare's The Two Gentlemen of Verona.",
  "Three verses to a lilting serenade over a bouncing piano. Light, graceful and smiling.")
s("brahms-feldeinsamkeit", "1879", "Composed around 1879 (Op. 86 No. 2); published in 1882",
  "I lie still in the tall green grass and look up into the sky. White clouds drift through the blue, and I feel as if I had long been dead, floating happily with them through endless space.",
  "Words by Hermann Allmers (1821-1902).",
  "Very slow and still, over a rocking piano. Long breath and quiet tone; the peace must never become heavy.")
s("mozart-abendempfindung", "1787", "Composed in Vienna in June 1787 (K. 523)",
  "Evening: the sun sinks, and life too will pass. When I am gone, friend, shed a tear on my grave; it will be the finest pearl in my crown.",
  "Words probably by Joachim Heinrich Campe (1746-1818).",
  "A deep, through-composed song: a calm tale that grows in feeling. Keep the line pure and the words clear.")
s("mozart-das-veilchen", "1785", "Composed in Vienna in June 1785 (K. 476)",
  "A violet in the meadow longs to be picked by a young shepherdess. She walks by singing and treads on it. It dies happy: at least it died by her.",
  "Words by Johann Wolfgang von Goethe (1749-1832).",
  "A tiny opera in three minutes, with narrator, violet and shepherdess. Give each a colour, and make the end tender rather than tragic.")
s("beethoven-ich-liebe-dich", "1795", "Composed around 1795 (WoO 123)",
  "I love you as you love me, morning and evening. We shared every care, and each made the other's lighter.",
  "Words by Karl Friedrich Herrosee (1754-1821).",
  "Simple, warm and steady. Keep it gentle and sincere, with a smooth line.")
s("strauss-zueignung", "1885", "Composed in 1885 (Op. 10 No. 1)",
  "You know, dear soul, how I suffer far from you. Once, drunk with freedom, I raised the cup and you blessed it, drove out its evil, and I sank holy onto your heart. Each verse ends: thank you.",
  "Words by Hermann von Gilm (1812-1864).",
  "Short and rising to a blazing close. Pace the voice: the refrain 'habe Dank' grows each time.")
s("strauss-allerseelen", "1885", "Composed in 1885 (Op. 10 No. 8)",
  "All Souls' Day: put the fragrant mignonette on the table, bring the last red asters, and let us speak of love again, as we once did in May.",
  "Words by Hermann von Gilm (1812-1864).",
  "Warm and yearning, building to a great climax. Rich legato and full breath.")
s("strauss-standchen", "1886", "Composed in 1886 (Op. 17 No. 2)",
  "A night serenade: open up softly, my love, and come out into the moonlit garden. The stream murmurs, the roses glow, the nightingale dreams of kisses.",
  "Words by Adolf Friedrich von Schack (1815-1894).",
  "Quick piano figures like rustling leaves, with the voice floating on top. Light and quick, saving the glow for the end.")
s("strauss-die-nacht", "1885", "Composed in 1885 (Op. 10 No. 3)",
  "Night steps out of the woods and quietly steals the light from everything: gold from the stream, silver from the church roof. Hold me close; I fear she will steal you from me too.",
  "Words by Hermann von Gilm (1812-1864).",
  "Hushed and mysterious. Very soft singing and clear words; the fear at the end should be felt, not forced.")
s("mahler-ich-bin-der-welt-abhanden-gekommen", "1901", "Composed in 1901, one of the Rückert-Lieder",
  "I am lost to the world, where I wasted so much time. I have died to its noise and rest in a quiet place. I live alone in my heaven, in my love, in my song.",
  "Words by Friedrich Rückert (1788-1866).",
  "Slow and inward, one long unbroken line over held chords. Complete calm; the end should seem to dissolve.")
s("mahler-liebst-du-um-schonheit", "1902", "Composed in 1902 for his wife Alma, one of the Rückert-Lieder",
  "If you love for beauty, do not love me: love the sun. For youth, love the spring; for riches, the mermaid. If you love for love, then love me, and I will love you always.",
  "Words by Friedrich Rückert (1788-1866).",
  "Intimate and simple, rising to a warm climax in the last verse.")
s("mendelssohn-auf-flugeln-des-gesanges", "1834", "Published in 1836 (Op. 34 No. 2)",
  "On wings of song I will carry you away, my love, to the banks of the Ganges, where lotus flowers wait and we can dream in peace.",
  "Words by Heinrich Heine (1797-1856).",
  "A floating melody over rippling chords. Keep it even and light; the line should seem to fly.")
s("beethoven-adelaide", "1795", "Composed in 1794-95 (Op. 46)",
  "He wanders alone through the spring garden, and in every blossom, in the evening glow and in the nightingale's song he sees and hears only her: Adelaide!",
  "Words by Friedrich von Matthisson (1761-1831).",
  "Two parts: a slow, lyrical first half and a quicker, passionate ending. It needs stamina and a sustained line.")
s("schubert-der-tod-und-das-madchen", "1817", "Composed in 1817 (D 531)",
  "A girl begs Death to pass her by: go away, I am still young. Death answers gently: give me your hand, I am a friend; you shall sleep softly in my arms.",
  "Words by Matthias Claudius (1740-1815).",
  "Two voices: the girl's quick, frightened plea and Death's calm, low reply over solemn chords. Contrast is everything.")
s("schumann-die-beiden-grenadiere", "1840", "Composed in 1840 (Op. 49 No. 1)",
  "Two French soldiers, coming home from captivity in Russia, hear that Napoleon has been taken. One, dying, asks to be buried in France with his sword, to rise again when his Emperor rides over his grave.",
  "Words by Heinrich Heine (1797-1856).",
  "A ballad that ends with the Marseillaise. Tell the story, and build to the heroic last verse.")
s("brahms-vergebliches-standchen", "1882", "Published in 1882 (Op. 84 No. 4)",
  "A boy at night begs to be let in: it is cold, my love will freeze. The girl answers: then let it freeze! Go home to bed. Good night.",
  "Words from a Lower Rhine folk song.",
  "A comic dialogue between a pleading lad and a teasing girl. Light, bright and full of character.")
s("brahms-sapphische-ode", "1884", "Composed in 1884 (Op. 94 No. 4)",
  "At night I picked roses from the dark hedge; they smelled sweeter than by day but shook dew on me. So too your kisses: with them came the tears of your heart.",
  "Words by Hans Schmidt (1856-1923).",
  "Broad, noble and warm. A long legato line and deep breath.")
s("brahms-immer-leiser-wird-mein-schlummer", "1886", "Composed in 1886 (Op. 105 No. 2)",
  "My sleep grows ever lighter. A dying girl dreams she hears her beloved call, but no one opens the door. If you want to see me again, come soon.",
  "Words by Hermann Lingg (1820-1905).",
  "Slow, sad and very intimate. Long, fragile lines; the final 'komm bald' should grow from inside.")
s("wolf-das-verlassene-magdlein", "1888", "Composed in 1888 (Mörike-Lieder No. 7)",
  "Before dawn the abandoned servant girl must light the fire. She stares into the flames, lost in grief, and remembers she dreamed of her faithless boy.",
  "Words by Eduard Mörike (1804-1875).",
  "Bleak and still. Plain, quiet tone; the tears come in the last verse.")
s("wolf-der-feuerreiter", "1888", "Composed in 1888 (Mörike-Lieder No. 44)",
  "The fire rider gallops to every fire in his red cap. One night he rides into a burning mill and is never seen again; later the miller finds his bones in the ruins.",
  "Words by Eduard Mörike (1804-1875).",
  "A wild ballad over a stormy piano. Fast and dramatic: vivid words and big contrasts.")
s("wolf-fussreise", "1888", "Composed in 1888 (Mörike-Lieder No. 10)",
  "Walking through the woods on a fresh morning with a new stick in hand, he feels like Adam before the Fall, full of simple joy.",
  "Words by Eduard Mörike (1804-1875).",
  "A buoyant walking song. A steady, cheerful stride and bright tone.")
s("wolf-auf-ein-altes-bild", "1888", "Composed in 1888 (Mörike-Lieder No. 23)",
  "In an old painting of a green landscape, the Child plays on the Virgin's lap; and there in the wood, already, grows the tree of the Cross.",
  "Words by Eduard Mörike (1804-1875).",
  "Short, still and austere. Very quiet; the last line darkens.")
s("schumann-im-walde", "1840", "Composed in 1840, from the Liederkreis, Op. 39",
  "A wedding party passes along the mountainside; birds sing and horns sound. Then it is gone, night falls, and in the wood a shiver runs through me.",
  "Words by Joseph von Eichendorff (1788-1857).",
  "It starts as a bright procession and ends in hushed unease. Change colour for the end.")

# French
s("faure-clair-de-lune", "1887", "Composed in 1887 (Op. 46 No. 2)",
  "Your soul is a chosen landscape where masked dancers play the lute, half sad beneath their fancy costumes, in the calm, sad and lovely moonlight.",
  "Words by Paul Verlaine (1844-1896).",
  "The piano plays a minuet and the voice almost talks over it, as if from the side. Keep the voice cool and the line smooth.")
s("faure-les-berceaux", "1879", "Composed in 1879 (Op. 23 No. 1)",
  "Along the quay the great ships take no notice of the cradles the women rock. But the day of farewell will come, and then the women's hands will seem to hold the ships back.",
  "Words by Sully Prudhomme (1839-1907).",
  "A rolling, rocking accompaniment like the sea. Long lines building to a broad climax and back.")
s("faure-au-bord-de-l-eau", "1875", "Composed around 1875 (Op. 8 No. 1)",
  "To sit together by a stream and watch it flow, the clouds pass and the world go by, and to feel that only love does not pass.",
  "Words by Sully Prudhomme (1839-1907).",
  "Calm and flowing. Easy, even legato; nothing should feel rushed.")
s("debussy-beau-soir", "c. 1880", "Composed around 1880-83",
  "When the rivers turn pink at sunset and a warm shiver runs through the wheat, enjoy the world while you are young, for we pass as the wave passes: the wave to the sea, we to the grave.",
  "Words by Paul Bourget (1852-1935).",
  "Shimmering triplets and a long, arching line. Gentle, growing toward the last phrase.")
s("debussy-nuit-d-etoiles", "1880", "Composed in 1880; Debussy's first published song (1882)",
  "Starry night, under your veils, in your breeze and scents, I dream of loves that are gone.",
  "Words by Théodore de Banville (1823-1891).",
  "Early Debussy, romantic and sweet, with a lilting refrain. Keep it simple and dreamy.")
s("duparc-chanson-triste", "1868", "Composed in 1868",
  "Moonlight sleeps in your heart, a soft summer moon. To escape life's troubles I will drown in your light; you will rest my head on your knees and sing me a sad ballad.",
  "Words by Jean Lahor (Henri Cazalis, 1840-1909).",
  "A flowing accompaniment under a long, warm line. Calm and tender, growing gently.")
s("duparc-l-invitation-au-voyage", "1870", "Composed in 1870",
  "My child, my sister, dream of going away to live together in a land like you. There, all is order and beauty, luxury, calm and pleasure.",
  "Words by Charles Baudelaire (1821-1867).",
  "Shimmering piano and a hushed, intimate voice; the refrain 'Là, tout n'est qu'ordre et beauté' must be utterly still.")
s("hahn-si-mes-vers-avaient-des-ailes", "1888", "Composed in 1888, when Hahn was thirteen",
  "If my verses had wings, they would fly to your garden like birds; if they had wings like the spirit, they would fly to you, like love.",
  "Words by Victor Hugo (1802-1885).",
  "Simple, pure and delicate. A gentle, flowing line at a soft dynamic.")
s("bizet-ouvre-ton-c-ur", "1860", "Composed around 1860",
  "The daisy has closed its petals, the rose its heart. But open your heart to me, my love, as the flower opens to the sun.",
  "Words by Louis Delâtre (1815-1893).",
  "A Spanish-flavoured serenade with a bolero lilt. Bright, flexible and a little flirtatious.")
s("chausson-le-temps-des-lilas", "1892", "The closing page of Chausson's Poème de l'amour et de la mer (1882-1892)",
  "The time of lilacs and roses will not come back this spring. Love is gone, and with it the season of flowers.",
  "Words by Maurice Bouchor (1855-1929).",
  "Slow, sad and noble: long lines over rich harmonies.")
s("berlioz-le-spectre-de-la-rose", "1841", "From Berlioz's Les nuits d'été (1841)",
  "The ghost of a rose a girl wore to the ball comes to her in her sleep: you wore me last night and I died on your breast. Here lies a rose that kings would envy.",
  "Words by Théophile Gautier (1811-1872).",
  "Long, luxuriant lines and a wide range. It needs breath control and colour; it is a dream, not a scene.")
s("faure-nell", "1878", "Composed around 1878 (Op. 18 No. 1)",
  "Your crimson rose, warmed by the sun, opens; in the warm night everything sings of my love for you, Nell.",
  "Words by Leconte de Lisle (1818-1894).",
  "Flowing, bright and elegant. A smooth line and a warm climax.")
s("faure-ici-bas", "1874", "Composed around 1874 (Op. 8 No. 3)",
  "Here below the lilacs die and songs are brief. I dream of summers that last forever. Here below every lover weeps; I dream of bonds that never break.",
  "Words by Sully Prudhomme (1839-1907).",
  "Short, sad and simple. Keep the line even and quiet.")
s("faure-en-priere", "1890", "Composed in 1890",
  "If my voice can reach you, Lord, hear a child's prayer: let me be pure and humble, and follow your way.",
  "Words by Stéphan Bordèse.",
  "Simple and devout, almost a hymn. Calm, pure tone.")
s("duparc-phidyle", "1882", "Composed in 1882",
  "The grass is soft for sleeping under the poplars. Rest, Phidylé, through the heat of noon; but when the sun sets, let your kiss reward my waiting.",
  "Words by Leconte de Lisle (1818-1894).",
  "A long build: calm, then growing ardour to a radiant climax. Plan breath and stamina.")
s("duparc-extase", "1874", "Composed in 1874",
  "On a pale lily my heart sleeps, a sleep as sweet as death: death perfumed by the breath of the beloved.",
  "Words by Jean Lahor (Henri Cazalis, 1840-1909).",
  "Rich, Wagner-like harmonies and a slow, floating line. Very soft and still.")
s("duparc-la-vie-anterieure", "1884", "Composed in 1884",
  "I once lived long under vast porticoes by the sea, among calm pleasures, with slaves who fanned me and whose only care was to deepen the secret sorrow that made me languish.",
  "Words by Charles Baudelaire (1821-1867).",
  "Grand and slow, with a hushed ending. It needs a big line and deep calm.")
s("ravel-kaddisch", "1914", "Composed in 1914, the first of Ravel's Deux mélodies hébraïques",
  "A prayer: may the great name of God be exalted and made holy, in your life and in your days.",
  "Words from the Jewish liturgy (the Kaddish), in Aramaic.",
  "Long, ornamented, chant-like phrases over still chords. Flexible, devout and very free.")

# English
s("purcell-music-for-a-while", "1692", "From Purcell's music for the play Oedipus (London, 1692)",
  "Music for a while shall ease all your cares, and even the dead in the underworld forget their pain, until the snakes drop from the Fury's head.",
  "Words by John Dryden and Nathaniel Lee.",
  "Over a repeating bass. Keep the line flexible and expressive; 'drop, drop' should fall like drops of water.")
s("purcell-if-music-be-the-food-of-love", "1692", "Composed in 1692",
  "If music be the food of love, sing on until I am filled with joy; your voice moves my listening soul to pleasures that never tire.",
  "Words by Henry Heveningham.",
  "Lively, florid and joyful. Clear words and nimble runs.")
s("purcell-nymphs-and-shepherds", "1692", "From Purcell's music for the play The Libertine (London, 1692)",
  "Nymphs and shepherds, come away; in these groves let's play, for this is Flora's holiday, made for ease and happy love.",
  "Words by Thomas Shadwell (c. 1642-1692).",
  "Bright, dancing and full of spring. A light, clean voice with lively rhythm.")
s("arne-where-the-bee-sucks", "1740", "From Arne's music for Shakespeare's The Tempest (London, 1740)",
  "Ariel's song: where the bee sucks, there I suck too; I lie in a cowslip's bell. Merrily shall I live now, under the blossom that hangs on the bough.",
  "Words by William Shakespeare (1564-1616).",
  "Light, sparkling and quick. A showcase for clear words and an easy top.")
s("quilter-now-sleeps-the-crimson-petal", "1904", "Composed in 1904 (Op. 3 No. 2)",
  "Now sleeps the crimson petal, now the white; the earth lies open to the stars. So fold yourself, my dearest, into my heart, and be lost in me.",
  "Words by Alfred, Lord Tennyson (1809-1892).",
  "Hushed and sensuous. A long, unbroken line over gentle chords; save the swell for the end.")
s("quilter-love-s-philosophy", "1905", "Composed in 1905 (Op. 3 No. 1)",
  "The fountains mingle with the river and the rivers with the ocean; nothing in the world is single. What are all these kisses worth, if you do not kiss me?",
  "Words by Percy Bysshe Shelley (1792-1822).",
  "Rushing piano and an exuberant, soaring line. It needs breath and energy to the final climax.")
s("ives-the-circus-band", "1894", "Composed around 1894; revised later",
  "All dressed up, the circus band marches down Main Street, and the town's boys run after it, wide-eyed at the horses, the clowns and the music.",
  "Words by Charles Ives (1874-1954).",
  "A rowdy march with ragtime in the piano. Energetic and full of character.")

# Spanish, Russian, Scandinavian, Czech
s("falla-nana", "1914", "Composed in 1914, No. 5 of Falla's Siete canciones populares españolas",
  "A traditional Andalusian lullaby: sleep, child, sleep, my soul, little star of the morning.",
  "Words from a Spanish folk lullaby.",
  "Hushed and hypnotic, with a gently ornamented line. Very soft, very still.")
s("granados-la-maja-dolorosa-no-1", "1910", "Composed in 1910, from Granados's Tonadillas",
  "A young woman of Madrid mourns her dead lover: cruel death, why did you steal him from me? She cannot stop weeping.",
  "Words by Fernando Periquet (1873-1940).",
  "Dark, dramatic and declaimed. Strong low notes and deep colours; grief turns to anger.")
s("rachmaninoff-vocalise", "1912", "Composed in 1912 (Op. 34 No. 14); revised in 1915",
  "There are no words: one long, sad, wandering melody, sung on a single vowel.",
  "No words: sung on a vowel of the singer's choice.",
  "One of the great tests of legato. Choose one vowel and keep it even throughout; shape the phrases like one slow, endless breath.")
s("rachmaninoff-how-fair-this-spot", "1902", "Composed in 1902 (Op. 21 No. 7)",
  "How fair this spot: far away a river gleams, the meadows are a bright carpet. No one is here; only God and I.",
  "Words by Glafira Galina (1873-1942).",
  "Calm, radiant and floating. The high, soft ending must feel easy.")
s("rachmaninoff-lilacs", "1902", "Composed in 1902 (Op. 21 No. 5)",
  "In the morning, at dawn, I go to the lilacs to look for my happiness. Among the clusters one small flower holds it.",
  "Words by Ekaterina Beketova (1855-1892).",
  "Delicate, fresh and flowing over a rippling piano. A light voice; the phrases rise like morning air.")
s("rachmaninoff-in-the-silence-of-the-secret-night", "1890", "Composed in 1890 (Op. 4 No. 3)",
  "In the silence of the night I remember your words, your look; long into the night I repeat your name.",
  "Words by Afanasy Fet (1820-1892).",
  "Passionate and rising: a gentle start and a great climax. It needs warmth and stamina.")
s("tchaikovsky-none-but-the-lonely-heart", "1869", "Composed in 1869 (Op. 6 No. 6)",
  "Only one who knows longing knows how I suffer: alone, cut off from all joy, I look up at the sky. The one who loves me is far away.",
  "Words by Lev Mei (1822-1862), after Goethe.",
  "A slow, aching melody that builds to a passionate climax. Hold the line and let the longing grow.")
s("tchaikovsky-at-the-ball", "1878", "Composed in 1878 (Op. 38 No. 3)",
  "In the noise of a ball I saw you by chance, your face veiled in mystery. Since then I see you everywhere, and I dream.",
  "Words by Aleksey Konstantinovich Tolstoy (1817-1875).",
  "A gentle waltz. Intimate, wistful and light.")
s("grieg-jeg-elsker-dig", "1864", "Composed in 1864 (Op. 5 No. 3), for his future wife Nina",
  "You are my thought, my being, my heart's first joy. I love you more than anything in the world, now and forever.",
  "Words by Hans Christian Andersen (1805-1875).",
  "Short and fervent. A simple, glowing line with a big climax.")
s("dvorak-songs-my-mother-taught-me", "1880", "Composed in 1880, No. 4 of Dvořák's Gypsy Songs (Op. 55)",
  "When my old mother taught me songs, she had tears in her eyes. Now I teach them to my children, and the tears run down my own face.",
  "Words by Adolf Heyduk (1835-1923).",
  "Tender and simple; let the memory colour the tone.")

if __name__ == "__main__":
    here = os.path.dirname(__file__)
    out = os.path.join(here, "../../src/standalone/songAbout.json")
    json.dump(A, open(out, "w"), ensure_ascii=False, indent=0)
    print(len(A))
