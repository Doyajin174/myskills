# How do you guys maintain a large AI-written codebase?

**Posted by u/agentic-consultant** | Score: 350

I use Opus 4.5 via Claude Code. Lately I’ve been using it to write me pretty amazing NextJS apps. 

The problem is, although the code works, it becomes a nightmare to maintain because I don’t have the codebase in my head. 

So maintenance and keeping track of which services we have and all the aspects of the codebase becomes difficult. 

It would be really nice to have a GUI with diagrams and flowcharts that summarizes the codebase at a high-level abstracted view, giving you a Birds Eye view of your codebase. 

Does anybody know of any apps or strategies to do this? Maybe something using Claude Skills or Hooks? 

I’m imagining a dashboard that’s like a “control center” for the entire app, listing all the modules and services and chunks of code, and maybe have a Claude instruction to consistently update that dashboard whenever it makes even the slightest change in the codebase. 

Has anybody done something like this? 

Now that writing code is almost solved (in common applications) I think the next target is how do we have AI write code at scale. 

---

## Comments

### u/ClaudeAI-mod-bot (Score: 1)

**TL;DR generated automatically after 200 comments.**

The overwhelming consensus is that **you are approaching this the wrong way and there are no shortcuts to understanding your own codebase.** The community strongly advises that you must learn the fundamentals of software architecture and "drive the bus" yourself. Relying on AI to build something you don't understand is considered irresponsible and a recipe for disaster, especially for client work. The OP's admission that they are not a developer and use Claude for client-adjacent tasks was met with a storm of downvotes and criticism, with many arguing that if you sell a service based on code, you have an ethical duty to understand it.

That said, people agree this is a common problem and offered some solid advice:

*   **Create a "map of the system" that is human-owned.** The most upvoted solution is to maintain a living `ARCHITECTURE.md` file with high-level diagrams (like Mermaid). AI can help you *write* this documentation, but you must be the one to own it and ensure it's updated with every structural change.
*   **Use Claude as an *architecture assistant*, not just a code generator.** Prompt it to analyze your codebase, map dependencies, and suggest refactors. You can also ask it to generate ASCII or Draw.io diagrams of your repo structure.
*   **Define the architecture *first*.** Before writing any code, lay out the folder structure, design patterns, and data flows. Then, have Claude implement the individual components within that framework.
*   **Generate a "helicopter view" file.** One user has a script that concatenates their entire codebase into a single `.md` file. They paste this into a new chat to have high-level, structural conversations with Claude about the whole project at once.

---

### u/IntrepidTieKnot (Score: 78)

You are looking for ✨documentation✨

---

> ### u/NotLogrui (Score: 8)
> 
> [Code Wiki](https://codewiki.google/)
> 
> ---
> 
> ### u/ClemensLode (Score: 17)
> 
> "I did ask Chatgpt to generate the documentation for my project. That did not help me at all. Or do you think I should read all that? You computer guys are weird." /s
> 
> ---
> 
> ### u/tomato_friend181 (Score: 9)
> 
> Why does this glib comment actually have upvotes. OP is looking for a tool to visualize codebases. Any actual suggestion for decent software to use?
> 
> ---
> 
>> ### u/cthunter26 (Score: 5)
>> 
>> A tool to visualize codebases... Like... an IDE? Isn't that literally what an IDE is?
>> 
>> ---
>> 
>>> ### u/[deleted] (Score: 6)
>>> 
>>> Not really. He even says what he was thinking of. Like psuedo-code flowcharts. These are really common in designing code to visualize how it will work before you actually write it. Also it would actually be pretty awesome if AI could look at a codebase and generate these kinds of charts on the fly.
>>> 
>>> ---
>>> 
>> ### u/crwnbrn (Score: 5)
>> 
>> because Google already offers a great tool doing exactly what OP wants called Code Wiki (completely free), and 2 minute manual research would have given him:
>> 
>> * **CodeSee** \- Auto-generates and updates codebase maps as code changes, with cross-repo visualization and visual code reviews [Codesee](https://www.codesee.io/)
>> * **CodeCharta** \- Visualizes codebases in 3D city-like maps, showing metrics like code complexity. All analysis happens locally with no data uploaded externally [GitHub](https://github.com/MaibornWolff/codecharta)
>> * **Emerge** \- Browser-based interactive codebase and dependency visualization supporting multiple languages with code quality metrics [GitHub](https://github.com/topics/code-visualization)
>> * **Madge** \- Generates visual graphs of module dependencies and finds circular dependencies for JS (AMD, CommonJS, ES6) and CSS preprocessors [GitHub](https://github.com/pahen/madge)
>> 
>> Or the easier way he could custom build his own project with Claude Code in 30 minutes and called it Knuth in my code. In honor of:
>> 
>> * **Donald Knuth:** Known for his monumental work, *The Art of Computer Programming*, Knuth demonstrated an extreme dedication to presenting complex material clearly, even inventing the TeX typesetting system to properly format mathematical equations. His work emphasizes meticulous attention to detail and clarity in explanation.
>> 
>> ---
>> 
>>> ### u/tomato_friend181 (Score: 5)
>>> 
>>> Thanks, I think this is closest to an answer for OP.   
>>> I disagree that this too obvious of a question to ask though. Code wiki for one only works on public repos, and one of the top comments on this thread was "The truth is the visualization tools you seek don't exist yet" so others would benefit from awareness if one of the tools you recommended fits this well. I'm currently not convinced you know these tools well, as your answer looks pretty AI generated.
>>> 
>>> ---
>>> 
>>>> ### u/crwnbrn (Score: 1)
>>>> 
>>>> Hence my final suggestion if none of these solutions do it for you build it yourself...
>>>> 
>>>> Code wink is coming out with a local private version as announced on the landing page. No eta on that but it is announced.
>>>> 
>>>> quangdungluong/codewiki: works for private repo 
>>>> 
>>>> https://github.com/quangdungluong/codewiki
>>>> 
>>>> There are lots of of them.
>>>> 
>>>> ---
>>>> 
> ### u/jmsfltchr (Score: 1)
> 
> [etchpad.dev](http://etchpad.dev) is aiming to do exactly this
> 
> ---
> 
> ### u/adolgushin (Score: 0)
> 
> Documentation is so 20th century
> 
> ---
> 
### u/AuditMind (Score: 114)

If you’re already leaning heavily on AI for code generation, why not also use it to reason about the codebase itself?

Things like architecture inventory, dependency mapping, identifying hidden couplings, or even proposing a modularization plan seem like exactly the kind of global reasoning where AI helps most.

Have you tried using it as an architecture/refactor assistant, not just as a code writer?

---

> ### u/Einbrecher (Score: 46)
> 
> The problem is knowing when you have enough. 
> 
> LLMs in general will never not make architectural suggestions, whether they're warranted or not, and the bigger your codebase, the more likely it is those suggestions ignore architecture you already have or make your code worse.
> 
> Ultimately, if you're doing anything bigger than a to-do app, you need to know what's going on in your code and why. 
> 
> You can ask the LLM for tips and best practices, but ultimately, you need to drive the bus and make the decisions.
> 
> ---
> 
>> ### u/darko777 (Score: 1)
>> 
>> Exactly- AI code does not follow any pattern and the organization of the code declines as more code is added from my findings.
>> 
>> ---
>> 
>>> ### u/Einbrecher (Score: 1)
>>> 
>>> You can set a pattern for it to follow, and it will usually follow it pretty well. It's just not intelligent about propagating that pattern.
>>> 
>>> In one instance, my instructions in my CLAUDE.md file for Claude to prefer composition over inheritance led to 7 different components - 7 instances of a ton of code duplication - instead of a single parent class and 7 significantly shorter child classes.
>>> 
>>> Claude, technically, did what I told it to do - even though the result was objectively stupid from an architectural standpoint.
>>> 
>>> ---
>>> 
>> ### u/[deleted] (Score: -12)
>> 
>> [deleted]
>> 
>> ---
>> 
>>> ### u/TechnicallyCreative1 (Score: 11)
>>> 
>>> You didn't even address the comment, you just jumped right into insults and hearsay
>>> 
>>> ---
>>> 
>> ### u/[deleted] (Score: -9)
>> 
>> [deleted]
>> 
>> ---
>> 
>>> ### u/crimsonroninx (Score: 3)
>>> 
>>> Haven't you seen the movie where the confident business person or politician who thinks they know best ignores the experts?
>>> 
>>> It's going to be fine, until it's not, and then it will be an absolute catastrophe. But sure, good luck!
>>> 
>>> ---
>>> 
> ### u/FuzzyLogick (Score: 19)
> 
> Someone said humans are the bottle neck to AI and I totally felt it.
> 
> ---
> 
>> ### u/vigorthroughrigor (Score: 2)
>> 
>> yup
>> 
>> ---
>> 
>> ### u/Big_Dick_NRG (Score: 1)
>> 
>> Just wait till AI figures that out
>> 
>> ---
>> 
>> ### u/agritheory (Score: 0)
>> 
>> The same "the customer doesn't know what they want" problem, upstreamed.
>> 
>> ---
>> 
### u/ClaudeAI-mod-bot (Score: 78)

TL;DR (100 comments)

The overwhelming consensus is that **you are approaching this the wrong way and there are no shortcuts to understanding your own codebase.** The community strongly advises that you must learn the fundamentals of software architecture and "drive the bus" yourself. Relying on AI to build something you don't understand is considered irresponsible and a recipe for disaster, especially for client work. The OP's admission that they are not a developer and use Claude for client-adjacent tasks was met with a storm of downvotes and criticism, with many arguing that if you sell a service based on code, you have an ethical duty to understand it.

That said, people agree this is a common problem and offered some solid advice:

*   **Create a "map of the system" that is human-owned.** The most upvoted solution is to maintain a living `ARCHITECTURE.md` file with high-level diagrams. AI can help you *write* this documentation, but you must be the one to own it and ensure it's updated with every structural change.
*   **Use Claude as an *architecture assistant*, not just a code generator.** Prompt it to analyze your codebase, map dependencies, and suggest refactors. You can also ask it to generate ASCII diagrams of your repo structure.
*   **Define the architecture *first*.** Before writing any code, lay out the folder structure, design patterns, and data flows. Then, have Claude implement the individual components within that framework.
*   **Generate a "helicopter view" file.** One user has a script that concatenates their entire codebase into a single `.md` file. They paste this into a new chat to have high-level, structural conversations with Claude about the whole project at once.

---

> ### u/vigorthroughrigor (Score: 11)
> 
> Great summary
> 
> ---
> 
> ### u/TrackOurHealth (Score: 3)
> 
> A single helicopter view file is not sufficient for a giant repo. I have a giant monorepo. 50 different packages / apps. Being organized is incredibly important. Each of the apps or package in my case has a README.files.md with a one liner description per file, with full file paths, and directories. 
> 
> Root of the repo, there are important principles, what is where on a high level. I have CLAUDE.md and AGENTS.md files to explain each section and with rules, such as how to compile, how to maintain, etc…
> 
> A single file for a whole repo doesn’t work. 
> 
> And you need to have agents to keep your documentation updated, and rules to always check what you already have before coding, it’s so important.
> 
> ---
> 
> ### u/bigasswhitegirl (Score: 10)
> 
> This is awesome!  Now can you make a few reddit bots which read the OP and automatically respond with their opinion when a new thread is created? Then we won't need to read, learn; or contribute anything and everything will finally be perfect.
> 
> ---
> 
>> ### u/OrangeAdditional9698 (Score: 1)
>> 
>> You for the /s
>> 
>> ---
>> 
### u/mrfrog222 (Score: 108)

you need to actually learn what you are doing.. relying on AI rots your mind and can’t lead to long term stability

---

### u/timmyge (Score: 13)

The truth is the visualization tools you seek don't exist yet.

---

> ### u/recoverycoachgeek (Score: 11)
> 
> Yup. But this space is developing quickly. Just watched Scott  from Syntax show us [Beads](https://github.com/steveyegge/beads) to better manage and visualize todo lists for our projects. I guarantee someone is building out something else right now just for architecture. I bet someone is building out one for code coverage. 2026 is gonna be a lot different.
> 
> ---
> 
>> ### u/timmyge (Score: 2)
>> 
>> I hear ya, Beads and Beans, on my list to play around with next.
>> 
>> ---
>> 
>>> ### u/recoverycoachgeek (Score: 1)
>>> 
>>> Beans is a cool idea too!
>>> 
>>> ---
>>> 
>> ### u/vigorthroughrigor (Score: 1)
>> 
>> yup
>> 
>> ---
>> 
> ### u/jmsfltchr (Score: 1)
> 
> Totally agree, had the same feeling/issue as OP even before we were coding with chat, so we've been building [etchpad.dev](http://etchpad.dev) to fill the gap :)  
> Would really welcome alpha testers who want such a thing to exist
> 
> ---
> 
> ### u/PussyTermin4tor1337 (Score: 0)
> 
> Check out gitlantis
> 
> ---
> 
> ### u/d33pdev (Score: 0)
> 
> they do i just haven't released it yet
> 
> ---
> 
> ### u/jeremyStover (Score: 0)
> 
> It's just not released yet ;) 
> 
> Was trying to nail legacy C# app support and Unity support.
> 
> Will have builds up soon for closed demo, I swear.
> 
> ---
> 
### u/Disastrous-Angle-591 (Score: 10)

the larger the code, the smaller the change

---

> ### u/vigorthroughrigor (Score: 2)
> 
> this guy softwares
> 
> ---
> 
### u/fynn34 (Score: 7)

I have AI do ascii architecture breakdowns of the repo to understand where things are

---

> ### u/vigorthroughrigor (Score: 1)
> 
> this is great
> 
> ---
> 
### u/ClemensLode (Score: 21)

Read a book on software architecture.

---

> ### u/im-a-smith (Score: 21)
> 
> Vibe coders discovering most of software development is barely writing code is the funniest development of this whole trend. 
> 
> ---
> 
>> ### u/pdantix06 (Score: 3)
>> 
>> i'm still a little concerned about the prospect of my career turning into becoming a middle manager, but threads like this make me feel a bit better about it
>> 
>> ---
>> 
>> ### u/[deleted] (Score: 0)
>> 
>> [deleted]
>> 
>> ---
>> 
>>> ### u/ClemensLode (Score: 1)
>>> 
>>> Yeah, but while you are waiting, other people are building software.
>>> 
>>> ---
>>> 
>>> ### u/towncalledfargo (Score: 1)
>>> 
>>> Mark my words - you don’t know what you’re talking about.
>>> 
>>> ---
>>> 
>>>> ### u/[deleted] (Score: 2)
>>>> 
>>>> [deleted]
>>>> 
>>>> ---
>>>> 
>>>>> ### u/towncalledfargo (Score: 0)
>>>>> 
>>>>> Bubbles already popping mate. Or rather deflating like a sad old fart.
>>>>> 
>>>>> ---
>>>>> 
>>>> ### u/The_Memening (Score: 1)
>>>> 
>>>> You're going to keep saying that all the way to the unemployment line.
>>>> 
>>>> ---
>>>> 
>>>>> ### u/towncalledfargo (Score: 1)
>>>>> 
>>>>> Senior dev with niche finance knowledge. I'll be fine.
>>>>> 
>>>>> ---
>>>>> 
>>>>>> ### u/The_Memening (Score: 1)
>>>>>> 
>>>>>> I'm a senior systems engineer with financial security; none of us will be fine as things are right now.
>>>>>> 
>>>>>> ---
>>>>>> 
>>>>>>> ### u/towncalledfargo (Score: 0)
>>>>>>> 
>>>>>>> What gives you that impression.
>>>>>>> 
>>>>>>> ---
>>>>>>> 
>>>>>>>> ### u/The_Memening (Score: 1)
>>>>>>>> 
>>>>>>>> AI doesn't have to be as good as we are, it has to be good enough to make CEO's believe it is better than us. That day is probably tomorrow. And Code AI will advance sufficiently in the meantime, that those same CEOs will be validated when Claude 6.0 is able to maintain complex System of Systems.
>>>>>>>> 
>>>>>>>> ---
>>>>>>>> 
> ### u/Narrow_Ad9226 (Score: 3)
> 
> Any recommended books? Currently junior-mid level ✌️
> 
> ---
> 
>> ### u/IntrepidTieKnot (Score: 1)
>> 
>> If you ever read one book on programming, read "Design Patterns: Elements of Reusable Object-Oriented Software." if you haven't already in college.
>> 
>> For pure architecture literature I strongly recommend "Fundamentals of Software Architecture" by Mark Richards &amp; Neal Ford. It's a great introduction if you start from scratch.
>> 
>> And then there is "Software Architecture in Practice" by Len Bass, Paul Clements, Rick Kazman. It's more theoretical but gives you everything you need to know to be able to understand the software architecture world.
>> 
>> I read them all and can not recommend them enough. Beware of uncle Bob's (Robert C. Martin) books. They're decent but heavily opinion driven.
>> 
>> ---
>> 
### u/VanMiller1984 (Score: 4)

Claude skills, and the bigger your program gets, the less you do at a time.

---

### u/greedy_stanley (Score: 5)

I have a tip.  Claude code, and other coding co-pilots can obviously read code.  They kind of do it in a targeted way though cause the navigate the folders and do it line by line and stuff. 

I created a simple Python script that I put in my git file, that when run just produces a long .md of the code base, with the hierarchy on top.  

That way, I can go to Claude’s or GPT chat outside a coding stream and have a helicopter level view conversation about the codebase, where it scans the whole thing top to bottom and has it all in its context.  

It’s been helpful.  I do it when I am at a good stopping point and get structural feedback!

---

> ### u/Head-Commission-8222 (Score: 1)
> 
> Could you explain a bit more about what the script does?
> 
> I’d like to create something similar, but I’m not sure I fully understand what you’ve implemented.
> 
> ---
> 
>> ### u/greedy_stanley (Score: 2)
>> 
>> Sure! Basically you run it, and it creates 1 single .md file output if the entire codebase.  The top page, is the file and folder hierarchy of the app, and the rest is all the code end to end.  So it’s just 1 single file you can drop in an LLM convo.
>> 
>> ---
>> 
> ### u/Competitive-Age-4917 (Score: 0)
> 
> Basically did something similar. Built a python gui that let me select folders and file types I want, and generate an md snapshot of my frontend and backend files. I use Claude web and just put both the frontend and backend .mds into the project files, and then Claude can scan through to make architectural decisions. Working fine with 110k lines of code (50% project capacity).
> 
> ---
> 
### u/Sceat (Score: 5)

This is definitely needed, building for scale and more advanced services structures always hit a point where adding a feature breaks 3 other, because there is a slight deviation in the context of the agent, you could think that he has every specs, that he knows precisely how some data flows from the frontend to the database passing by multiple services, you could have skills subagents vector memory and even advanced context engineering.. but in reality not everything is perfectly right which results in a forgotten param, a renamed key, a fix in the wrong place.. and everything breaks. I'm a engineer since 10+ years and I know to the core how to build systems so not understanding code is not the issue here. We truly need to design a concept to deeply visualise our infrastructures and especially how inputs are being composed and forwarded from A to B through AI written code.

I'm gonna brainstorm this myself and I'll come back here if finding anything

---

> ### u/vigorthroughrigor (Score: 3)
> 
> would love to share notes
> 
> ---
> 
> ### u/Sceat (Score: 1)
> 
> Still working on a solution, so far my conclusion is to generate observation of the codebase on demand [https://x.com/Sceat\_/status/2001135055591367162?s=20](https://x.com/Sceat_/status/2001135055591367162?s=20)
> 
> ---
> 
### u/casualviking (Score: 5)

You need to watch it like a hawk when it generates code, and you need to be explicit in CLAUDE.md about the architecture you want. There are no shortcuts.

---

### u/HotSince78 (Score: 7)

So let me get this straight - you don't really know the architecture of the software you are getting claude to build? 

But you want it to generate diagrams and explain it for you?

And you don't know how to prompt it to ask it to create a diagram of the software for you?

---

> ### u/[deleted] (Score: 1)
> 
> [deleted]
> 
> ---
> 
>> ### u/HotSince78 (Score: 8)
>> 
>> Thats not what you said in the main post.
>> 
>> ---
>> 
### u/virtual_adam (Score: 3)

&gt;it would be really nice to have a GUI with diagrams and flowcharts that summarizes the codebase at a high-level abstracted view, giving you a Birds Eye view of your codebase.

This is one of the easiest things for opus to do. Whatever you’re asking for, literally post this message into a coding agent using opus 4.5 and you’ll get it 


Generally you want TDD (a little too late for your current app, but next time), as well as documentation both for technical aspects and business logic aspects 


And again, all of these things j mention will be breeze for opus

---

### u/AlternativeNo345 (Score: 3)

How do you maintain a large Human-written codebase?

---

### u/DarkFoxss (Score: 3)

I have three ideas, that helped me - you can give it a chance, may be it’ll help you too
1. Try Windsurf. They have codemaps (generated diagrams and schemas of some parts of your code + chatting about it) and deepwiki (some kind of auto-generated documentation) + fast context feauture, that helps model with creating explanations and docs. I use claude code cli for planning and creating code and after that I use Windsurf for reviewing, updating documentation and sometime bugfixing
2. Create architecture with dozen small independent modules, that are connected only through some kind of “engine”, and document api contracts very careful. In this case you only need to understand one module at a time. Also functional style really helps for LLM, immutability is literally saving my mind.
3. Try to think not as developer, but as business/system analyst. I am some kind of BA and find it very helpful, coding with LLM really feels like creating tasks and requirements for devs. You don’t need to understand every part of the code, you can’t control how developer is working, what instruments he is using. But you can control the conditions and constraints: you must know the ideal behavior of the system, you must know what it shouldn't do and why, you must know all the extreme cases and use cases, you must know how to test all of this, plus when and where it was implemented. If you have this understanding, then even without knowing the code, you can ask the right questions.
And yeah, always keep your documentation actual, update changelog after every commit, and test everything after every 2-3 tasks (or 6-8 small tasks), so you could always say when your agents made broke everything and return to that point.

---

> ### u/DarkFoxss (Score: 1)
> 
> Forgot one more thing. Let your Claude work on one task at a time. Even better if it’s one task in one place/module/group of files/etc. When it finishes the task, ask them to create a short summary for you: what has changed, how every point of definition of done was realised, where could be problems. And actually read it, yeah.
> Never let Claude go through all your codebase like a storm, changing dozens of files, editing docs and tests, while creating new features and fixing bugs simultaneously. Read task - explore code and docs - create a plan - ask me is it right - implement - test and check quality - create summary. Repeat for every task, and task should be small. If your task need more than 30 minutes of work — you should divide it into subtasks.
> 
> ---
> 
### u/AVanWithAPlan (Score: 3)

If file sizes creep above 1000 lines I generally trigger a modularization review where we pull out behavior and then the hierarchical structure of your code base becomes a sort of map because no individual piece of code is doing more than 500 to a 1000 lines of code at a time

---

### u/Beneficial_Monk3046 (Score: 10)

Have you considered sitting down and understanding your code base?

---

> ### u/ghosthendrikson_84 (Score: 1)
> 
> OP isn’t here for rational solutions to his problem!
> 
> ---
> 
> ### u/[deleted] (Score: -13)
> 
> [deleted]
> 
> ---
> 
>> ### u/Levelup94 (Score: 6)
>> 
>> Yes, obviously. React has its responsibilities, and developers have theirs. When something breaks, competent developers know which side of that line the issue falls on. If your components aren’t rendering correctly, you need to know whether it’s your business logic failing or React’s rendering engine having issues.
>> 
>> That’s why you learn the framework. So when a bug appears, you know whether to fix your code, downgrade to a stable React version, or file an issue upstream.
>> 
>> ---
>> 
>> ### u/Beneficial_Monk3046 (Score: 3)
>> 
>> Personally never used any form of JS. Mostly a C, Python, and Matlab kind of guy. I’m just saying that you should understand how your own codebase works. If you have trouble picturing it in your head, sit down review it all and write down how everything works. Once you do that you will have a much clearer picture and that will make maintenance much easier.
>> 
>> ---
>> 
>> ### u/whats_a_monad (Score: 3)
>> 
>> What a great attitude!
>> 1. Ask for advice
>> 2. Get advice from actual software engineers
>> 3. Mock them
>> 
>> ---
>> 
>>> ### u/[deleted] (Score: 1)
>>> 
>>> [deleted]
>>> 
>>> ---
>>> 
>> ### u/Gold-Target-5462 (Score: 2)
>> 
>> Um... Yes? This is a great idea. I've often dug into libraries and frameworks I use to understand how they work and are built. A number of react devs I work with have done this too.
>> 
>> Coding something in pure vanilla JS is also a fun experience and learning opportunity...?
>> 
>> ---
>> 
>> ### u/Specialist_Aerie_175 (Score: 2)
>> 
>> You mention this as some incredible feat but people actually do that, also its really not that hard to understand if you have some experience.
>> 
>> But to answer your original question, whithout knowing how to code and setting up the barebones architecture yourself there is currently no way for llms not to make a mess in large codebases. 
>> 
>> You need to have strict types, validation, unit/integration tests,  clean separation of logic, uniform directory/files stucture, documentation so llm can have context. 
>> 
>> When you have this whole pipeline setup where most of your bugs can be caught by tests/types llm can really shine.
>> 
>> ---
>> 
>> ### u/YogurtOfDoom (Score: 1)
>> 
>> Yes. This is a big reason why open source is so popular: you can look inside. 
>> 
>> I've been a programmer for around four decades, so can tell you categorically that best results come from understanding as many layers of the stack as you possibly can. Keep learning, there are no shortcuts.
>> 
>> And for what it's worth, vanilla JS is incredibly powerful and useful.
>> 
>> ---
>> 
>> ### u/cthunter26 (Score: 1)
>> 
>> I do all those things. And because I understand software architecture and how to read code I can quickly and easily disect any framework and any language because they're all basically the same.
>> 
>> I can eat requirements documentation and shit larger code bases than the one you're currently stuck on. Usually by lunchtime on Monday. Then I can architect the next big solution on Tuesday.
>> 
>> ---
>> 
### u/NostalDev (Score: 5)

I’ve hit the same wall. The code works, but it is not in your head, so everything feels fragile. What helped me wasn’t a fancy GUI, but forcing a simple “map of the system” to exist. A living [`ARCHITECTURE.md`](http://ARCHITECTURE.md), a few high level diagrams, and a rule that any structural change must update them. AI can help write the map, but the map itself needs to be human owned. Once that exists, maintenance gets much calmer.

---

### u/HirtLocker128 (Score: 3)

You should know what your codebase does… this is the problem with having these tools do this for you without knowledge

---

### u/paplike (Score: 4)

I’m a software developer, I understand the code that it’s being written. But I’d still like someone to help me on how organize the documentation, both for Claude and for humans. I guess Claude.MD files should be short to not pollute the context and I can have bigger md files that explain certain modules in depth? So if I want Claude to add a feature to module X, I can link X’s documentation on the prompt?

Maybe I should ask Claude about this

---

> ### u/vigorthroughrigor (Score: 2)
> 
> Yes exactly, your [Claude.md](http://Claude.md) should only have ultra concise summaries and link outs to the deeper docs. Works great!
> 
> ---
> 
> ### u/EnchantedSalvia (Score: 1)
> 
> Also a SWE and OpenSpec has been okay.
> 
> ---
> 
>> ### u/paplike (Score: 1)
>> 
>> Sounds good, but that seems more like a task management system?
>> 
>> ---
>> 
>>> ### u/gycoh (Score: 1)
>>> 
>>> It's true that it feels that Claude is so proud of its md files, it tends to create new ones instead of updating the main one. I use to review code update but be more negligent with the md. Wow did it write a full story there in 26 volumes
>>> 
>>> ---
>>> 
### u/Due_Answer_4230 (Score: 3)

this is a necessary product... if someone hasn't made it, someone will. Or you can vibe one yourself.

---

> ### u/vigorthroughrigor (Score: 1)
> 
> its not easy to build such abstractions
> 
> ---
> 
### u/90gradi (Score: 2)

"It would be really nice to have a GUI with diagrams and flowcharts that summarizes the codebase at a high-level abstracted view, giving you a Birds Eye view of your codebase."

Guess what, you can build it yourself.

---

### u/ElwinLewis (Score: 2)

I built dashboard/command center browser that interacts with Claude code windows and helps me keep everything within the project organized. Docs, depdency graph, etc. 

I can add features, then launch those prompts from a “launch Claude code” button that opens the window, pastes in the prompt and runs it

While it runs there’s a watchdog python monitoring happening that’s making sure the file changes don’t violate certain patterns/rules. If a violation is found according to the watchdog monitoring, a seperate Claude code window opens to investigate whether or not it’s actually a violation. If it finds with high confidence a violation happened a steering prompt gets sent to the original Claude window working on the feature.

After we test the feature, a /complete slash command for Claude will automatically mark the feature as complete and if git was used for session will show diff.

There is also build history/time tracker, a dependency graph that can be referenced, a knowledgebase that has contains docs, components, and safe patterns

It’s also integrated with the stream deck so can launch the dashboard with a button and click a button when Claude is done

Took a week or so to make it but it’s going to save me from being disorganized with tons of different docs and plans, feature lists- to have it all in one place and then be able to launch and track from there will keep the project moving.  Excited

here’s what it looks like

---

### u/Particular-Tie-6807 (Score: 2)

This is exactly why I built [Agent Provisioner](https://agent-provisioner.springsoftware.io/). It analyzes your GitHub repo and generates a complete `.claude/` config - agents, skills, hooks, and a structured [`CLAUDE.md`](http://CLAUDE.md) that keeps Claude oriented in large codebases.

Basically bootstraps the "control center" you're describing. Connect GitHub, pick a repo, get a PR with everything configured in \~5 min.

The key is giving Claude explicit architectural context rather than having it rediscover your codebase each session.

---

> ### u/The_Hegemon (Score: 1)
> 
> This is great but is there any way to run this on a Github Enterprise repo? 
> 
> ---
> 
>> ### u/Particular-Tie-6807 (Score: 1)
>> 
>> Yes, if you have permissions to authorize an app for the org.
>> 
>> ---
>> 
### u/[deleted] (Score: 2)

In one breath they will all tell you that any issues you have are with your prompt, and in the next breath tell you that you must learn all your code.

AI can do no wrong in this sub.

---

### u/ReallySubtle (Score: 2)

Personally I obsess on “modularity”. I want everything to live in its own class. Tell your AI to think about things in little parts that come together. I have lots of abstractions and have Claude create things that are interchangeable. If I want to try something else, I can create different variations and the abstract objects make it easier for Claude to navigate the code.

I use FastAPI + HTMX + DaisyUI

---

### u/trmnl_cmdr (Score: 2)

The consensus here is wrong. You are just not doing enough in the planning stages. You need a stage where you’re interacting with a model that has full access to the codebase while you describe features. Ask the model to help you complete the plan. Then you need to do another context session of strictly codebase and web research based on that plan. The end result will be your actual prompt as a structured document. It will have all the information needed to one-shot the plan and nothing more.

Unit test everything as you go. Ask your model to lock down your codebase. 

As long as you don’t give your models 3 months’ worth of work at once, it’s pretty hard to go wrong with this process. The key is the one-shot implementation combined with regular regression testing. You don’t have to know your codebase if you know your application and you know how to interact with an agent in the right ways.

---

### u/returnofblank (Score: 2)

You don't. Vibe coding is a direct path to technical debt.

Regardless if AI writes good code -- if you don't understand it, you can't maintain it.

---

### u/redditforaction (Score: 2)

Check out Noderr. It’s a system of prompts that you “install” in your codebase. Initial setup is a series of prompts that analyze your code base, label classes/packages as nodes, creates a spec MD file for each node describing its essential functionality and all of its dependencies.

Once this initial inventory is done, you run a series of prompts whenever you’re beginning a “work session”. A work session, which is itself documented in a log, consists of 1/ developing specs which directly reference the nodes being changed, 2/ it modifying these node MD files as being in a WIP state, 3/ implementing changes, 4/ verifying the implementation against the original spec, 5/ making corrections until it matches 100%. 

The prompts for transitioning between steps are premade and your agent, based on the language in the prompts, is able to tailor them to the code base you were working in based upon the specs that NODERR generated and constantly updates. 

Once the implementation is complete, you paste a prompt that will update the details of these new files to match the new behavior, mark the nodes as complete along with the work session itself. Then you commit and update the specs of the changed nodes along with the code. 

I came upon it somehow on GitHub and it’s been very helpful. As a non-vibe, career SWE working on big systems at a FAANG, the way that it documents the various systems and their dependencies in your codebase reminds me of how each member of a team usually owns, whether by choice or otherwise, some area of the code base. Assuming you like them, you’re easily able to ask them how X interacts with Y or if there’s any quirks you need to know about Z and they can quickly rattle off the answer. This is very useful when the context window is very, very short relative to what’s needed to understand the whole codebase.

---

### u/volthis (Score: 2)

I maintain Mermaid charts from the start, keeps me sane! It really helps visualise user flows and database relationships, there’s a Cursor plugin (which I use) but there should be tools for your setup too. It’s a JS based diagramming tool that renders MD into diagrams.

---

### u/kylife (Score: 2)

Have it build out mermaid diagrams as you build

---

### u/Juno9419 (Score: 5)

If you don't know your codebase, it's simply not yours. Maybe you're moving too fast; you should at least review what's going on in it.

---

### u/sf-keto (Score: 2)

CodeScene. Adam Tornhill is a genius.

---

> ### u/vigorthroughrigor (Score: 2)
> 
> Do you use it?
> 
> ---
> 
>> ### u/sf-keto (Score: 1)
>> 
>> Yes and so do many other people I know. Mathew Skelton of Team Topologies always recommends it.
>> 
>> ---
>> 
>>> ### u/vigorthroughrigor (Score: 1)
>>> 
>>> I'm gonna give it a shot. Do you use the open source version or the paid plan?
>>> 
>>> ---
>>> 
>>>> ### u/sf-keto (Score: 1)
>>>> 
>>>> The CTO went for the paid. But that was just his choice. Tell us how it works for you.
>>>> 
>>>> ---
>>>> 
### u/daresTheDevil (Score: 2)

The same way you maintain any large codebase. AI is my pair programmer that works on my schedule and is way better at writing documentation. The idea that you could maintain a “large” codebase without understanding any of it is foolish.

---

### u/kex_ari (Score: 2)

Have you ever considered not being lazy and learning stuff?

---

### u/Pakspul (Score: 1)

In my architectural design the patterns applied are described, also the project structure etc. Once a while I do review sessions to see if everything still fits or don't accept solutions that deviate from design.

---

### u/MediocreApricot484 (Score: 1)

We use BMAD

---

> ### u/vigorthroughrigor (Score: 2)
> 
> whats that
> 
> ---
> 
### u/deke28 (Score: 1)

Just get a new job so that you never have to worry about maintaining it

---

### u/teomore (Score: 1)

/init and read [CLAUDE.md](http://CLAUDE.md)

---

### u/tossaway109202 (Score: 1)

Your code is as good as your unit tests and e2e tests like cypress. If you deeply understand those you should be able to scale. Never make your own authentication system just use something off the shelf for that. 

---

### u/NikkiMyCat (Score: 1)

I would take an opposite approach. I would define the architecture including the flow charts first, probably decouple the components and let Claude implement the components and add test coverage

---

### u/Dodokii (Score: 1)

If you wrote with AIyou should be able to know it. Unless you wote long prompt and forgot it, only to check with done on console. The architecture you gave determines where code goes

---

### u/tvmaly (Score: 1)

Always ask the model to use Single Responsibility Principle, make the code easy to mock and test. This has been what has helped me to keep AI code maintainable.

---

### u/thelastlokean (Score: 1)

Ime you need context added in some form for the high level stuff.

So, like backend, i have baseline organization on controllers, service, repo, models, dtos, max file length, etc.

If I was starting a new project today, I'd hand layout the folder structures first.  I don't let AI get involved until I've set all the basic patterns.

But I review every change thoroughly and commonly refactor chunks.  

I also use proper version control and flirt with TDD.

Also, I do things like procedurally generate frontend models from backend dtos.

---

### u/Express_Bit5748 (Score: 1)

Define “large”

---

### u/twocafelatte (Score: 1)

Check out neo4j to visualize graphs

---

### u/Successful_Tap_3655 (Score: 1)

Pro tip:

Switch to rust. Eliminate duplication of code. Use strict standards on the linting and testing. Keep code files short and under 300 LOC. Have it well organized and broken into logical sections and code.

---

### u/elchemy (Score: 1)

Gemini code wiki is a good option to add a "knowledge" layer.

---

### u/JakubErler (Score: 1)

Frappe Framework + Cursor + MCP

---

### u/Altruistic-Post-5665 (Score: 1)

I use Opus 4.5 on RooCode and if I ask it to create a flowchart/tree diagram of the entire code base/pipelines it does it visualizes it flawlessly

---

### u/Almost_Gotit (Score: 1)

We use aetherlight.ai. It’s brand new in alpha but is working really well and is currently free.   Project plan/sprint plan. Organizes code and docs,  helps with locking code and testing

---

### u/deadadventure (Score: 1)

You need indexing, with that you can ask ai to make you comprehensive documentation

---

### u/Sidion (Score: 1)

How do we maintain a large codebase developed by hundreds of devs over a decade? Documentation, code reviews and good testing.

---

### u/Acrobatic-Comb-2504 (Score: 1)

This is why software development is hard. Its never been about lines of code. Its about architecture.  
This is what happens if you let the model dictate the structure, and accept working output instead of your own design.

There are no shortcuts.

A dashboard, flowchart, or birdseye view will not fix that. Summaries only help if the underlying mental model already exists. Without that, they just give you a false sense of control.

Thats why I built tools to help enforce coding standards and I also, personally dictate the shape of the project, never let the model take over this part.

---

### u/DrangleDingus (Score: 1)

Can’t believe I’m saying this but the SAP  Fiori app extension in VS Code already does exactly this and gives you a beautiful automatic UI of all tables &amp; services &amp; UI patterns in the code base. 

It’s the first extension I’ve seen that does exactly what you are looking for. 

I’m sure there will be about 100X other extensions that do the same thing soon.

---

> ### u/Odd-Marzipan6757 (Score: 1)
> 
> Why there is so many SAP fiori extensions. Which one is it
> 
> ---
> 
>> ### u/DrangleDingus (Score: 1)
>> 
>> I think there’s only one? Just type in Fiori in the VSCode extensions tab it will come up. 
>> 
>> The Fiori SDK is also super helpful. You can oneshot entire CRMs with basic “floor plans” now. Hook it up into a HANA database or SQL database of your choice. 
>> 
>> Become like a God among your less intelligent coworkers.
>> 
>> ---
>> 
### u/trevorthewebdev (Score: 1)

you don't. let it look at components and give you thoughts or 360 view on all, but then focus your shit, dont take shortcuts

---

### u/RedParaglider (Score: 1)

I built the LLMC, the greatest local llama enriched rag database the world has ever known to give my LLM'S the least amount of context data that they need to do a great job.  Along the way I learned a shit ton about software architecture, and am still learning.

---

### u/HKChad (Score: 1)

Tell it to create draw io diagrams of each component

---

### u/ithkuil (Score: 1)

I think that's a good idea but it could probably mainly just be a single markdown file that is mentioned in the instructions. Keep it lightweight with file locations, descriptions for each module, and overview of how services interact. Each module has a readme. And the dashboard could just be a static HTML page that renders the markdown so it looks nicer for you.


People are always going to take an opportunity to crap on you when they see it. But it's a legitimate idea and if it's okay for the AI to write a bunch of modules then it's perfectly valid for it to update the architecture when necessary and document it for you. And of course you would help guide it.

---

### u/jbp216 (Score: 1)

have your ai create specification files for each class/service/etc and explain logic and methods step by step. you  can then read and edit logic in plain english, and then feed it back to make modifications

---

### u/sabetai (Score: 1)

Just load it into Gemini and generate architecture images with nano banana pro.

---

### u/DT_770 (Score: 1)

“because I don’t have the codebase in my head”. 

You answered your own question here. Agentic coding isn’t an excuse to skip this step.

---

### u/eighteyes (Score: 1)

I have a pre-release approach for this, I'd love your take.

---

### u/EmotionalAd1438 (Score: 1)

It helps if you review all code merges from now on. Put it the work 🥴

---

> ### u/[deleted] (Score: 1)
> 
> [deleted]
> 
> ---
> 
>> ### u/NotzoCoolKID (Score: 1)
>> 
>> Funny how he thinks this is last major barrier, but doesn't know how to code.  We went to the moon, so going to mars is easy.
>> 
>> ---
>> 
### u/indigo_dt (Score: 1)

FWIW the Vibe Coding by Gene Kim and Steve Spear (both DevOps luminaries) suggests some constructive patterns and approaches that can lead organically to better understood and more intentional codebases

---

### u/xnwkac (Score: 1)

Just make the AI do some diagrams for you. You can easily have diagrams in your README.md using ”mermaid” if your markdown editor supports that

---

### u/Prestigious_Debt_896 (Score: 1)

I use AI to build the template and then micromanage it when I need help / look for flaws and issues

---

### u/Steve15-21 (Score: 1)

CodeSee

---

### u/AriyaSavaka (Score: 1)

Test Driven Development and Intergration Test. I won't leave the AIs alone until they show me that my product actually works and satisfies my requirements.

---

### u/lordplagus02 (Score: 1)

That’s the neat part, you don’t!

---

### u/DazzlingOcelot6126 (Score: 1)

I got a dashboard that shows some inner workings of what you are doing with claude code. Not exactly a code overview per say, but you can gain insight into what is going on over multiple projects. WIP for sure I just refactored the monolithic code for dashboard, so I am playing catch up to fix a few new bugs. The core framework is very robust though. It has very much changed the way I use claude code. That is why I released it open source so others can get a jump start from my work. [https://github.com/Spacehunterz/Emergent-Learning-Framework\_ELF](https://github.com/Spacehunterz/Emergent-Learning-Framework_ELF) hope it helps. If anyone finds it useful I'd appreciate a star!

---

### u/mufasadb (Score: 1)

This was written to basically make a graph db of your codebase. 
https://github.com/mufasadb/code-grapher
Once Claude or similar has access to that graph db it can navigate the codebase quite well, but importantly you can read a fair bit of what's going on from a visualiser on the graph db. 
It's built to plugin to a locally (or home server for me) version of neo4j

---

### u/Playful_Criticism425 (Score: 1)

Cursor with Git

---

### u/Azaex (Score: 1)

Having a mental model of how the codebase should b structured and maintained based on prior experience with said languages, with AI simply being a vector to writing it really fast.

Have started to used AI to strat and restrat a codebase with me multiple times before getting going.

---

### u/LetterheadNew5447 (Score: 1)

Ask for uml diagrams

---

### u/Levelup94 (Score: 1)

you can ask claude code to write plans and documentation (with mermaid diagrams) for you which could contain the info you need. but thats not the form factor you’re looking for. If the code base gets too big you can have different readmes in each of the subfolders explaining in increasing detail whay is happening. Ultimately the code itself is the best documentation with the highest resolution detail. If you are confused with your codebase right now then you can ask claude to explain each folder one by one

---

### u/let_heemCook (Score: 1)

You probably lose the codebase map because you don't control the output when using AI.
Lately, I don't write code anymore. I do the thinking and planning, and AI does the execution. I give detailed guidelines for every task (filenames, code structure, etc.). If you do this, you'll never not understand your codebase no matter how large it gets. 
Also properly document the code, and refactor often.

---

### u/Forsaken-Parsley798 (Score: 1)

Always ensure your project is modular.

---

### u/Andreas_Moeller (Score: 1)

You already know what the answer is. It hasn’t changed.

---

### u/robertDouglass (Score: 1)

I break them down into logical sub projects and then use Spec Kitty to drive the development process in each project. I also have a planning project where I use Spec Kitty to do the meta planning at the highest level.

---

### u/featherless_fiend (Score: 1)

As long as you have a full architectural understanding that:

- Your program is broken up into files, each file being its own feature.
- Within those files the code is broken up into functions, each function having a purpose which you understand the purpose of.

Then you're golden.

---

### u/redditfreddit090 (Score: 1)

Tie it to project management system trough MCP -s and have epics, tasks , issues etc all in jira or similar, also all the plans let it store locally and also via MCP to confluence etc. And then all your PRD -s etc can have those generated diagrams, locally and on PM tools . Also it is important to keep the docs on the same structure as your code as then the context is easily available for AI tools.

---

### u/Mysterious-Pick-773 (Score: 1)

the same way you wrote it. if ai wrote it, let ai maintain it.

in my experience, vibe coded app (aka app slop lol) is very hard to maintain, and for my own app slop i don't worry about it.

---

### u/SecureVillage (Score: 1)

Using Claude means, as a developer, you don't write as much code. But use the time you save to read code instead.


You should be working just as many hours, but you're designing, planning, reading and reviewing instead of typing code.


It's your job to be the glue between the business and the AI. You are the context. The code you commit is your responsibility, not Claude's. It's your name on the commit messages. It's you who is legally responsible. Etc.

---

### u/tonybentley (Score: 1)

Proper unit testing, coding standards, integration tests, and strict context files for convention guardrails

---

### u/Embarrassed-Tea-3064 (Score: 1)

If you don't know the codebase then you need to read it

---

> ### u/[deleted] (Score: 1)
> 
> [deleted]
> 
> ---
> 
>> ### u/Embarrassed-Tea-3064 (Score: 1)
>> 
>> Mans got more vibe than R Kelly
>> 
>> ---
>> 
### u/ijustknowthings (Score: 1)

RAG

---

### u/jeremyStover (Score: 1)

I am about to release an app that does just this across 26 languages and frameworks, with more on the way.

Code graph generation, duplicate code detection, security audits, cognitive complexity, all compressed to toon format. 

There is a ton more, but the best part is it has 70-90% on file size along while being searchable.

It can search and accept fuzzy search and audit every layer in a git repo from base to any number of work trees.all within milliseconds, even on my test codebases like the 40+ gig chromium repo. 


HMU and I can see about getting you a build, as I am already using it daily, and it's deployed in a few security pipelines around the net successfully.

---

### u/sP0re90 (Score: 1)

You can try to ask Claude Code to generate a mermaid diagram for this into an md file so you can visualize it also on GitHub

---

### u/[deleted] (Score: 1)

I would advise you to have Claude build in tooling for the project. There plenty of open source projects for static code analysis and copy paste detection that can be run and the results reviewed by Claude. You still need to ensure the action taken is sensible and follows good software design patterns (there are great books on this). Such tooling can help identify where to start refactoring which can lead to good software architecture, if you pick appropriate design patterns. Also tests and a CI pipeline using GitHub actions. Having Claude write some tests that are triggered in a push to a branch using GitHub actions can help Claude focus on writing testable code which again can lead to sensible architecture decisions.

Examples:

A simple python web app https://github.com/matthewdeaves/myrientps3loader

A PHP content management system https://github.com/matthewdeaves/willow

---

### u/RepoBirdAI (Score: 1)

Ask the AI to maintain it.

---

### u/naapurisi (Score: 1)

Lighweight AGENTS.md files across main modules/component folders. Root AGENTS.md acts as a index that shows where to start look for what.

Then when I see agent run command that is incorrect or has to do multiple tries, I update the instructions so that the agent issues the command in the correct form.

---

### u/tuple32 (Score: 1)

if you don’t understand the code, you will hit the wall very soon

---

### u/Cause-n-effect11 (Score: 1)

I love it when AI uses one file to make a project in swift or node or even react.  Just keep piling on the code and that causes massive massive token burn by the very problem it caused.  I’ve see a react control panel 10k lines long until I forced it to break it into components which is the correct way to do it. 

Unfortunately while it was breaking down my code into components my usage limits ran out and have to wait 4 days to reset these atrocious limits.

---

### u/randoomkiller (Score: 1)

you dont

---

### u/sky63_limitless (Score: 1)

Help me with resources to handle Claude Code +Opus 4.5

Hi Can you share some resource or help learning and master the workflow to deal with Claude Code and utilize its power for my coding task ?

any source, video or online tutorial will massively help

I am a academic researcher iterating through my ideas. So I wanted to build a lot of ideas first through code implementations and want to test it.

  
Actually I am failing to handle Opus 4.5 in Claude Code

---

### u/LogicalAd766 (Score: 1)

This is the hardest part. The code grows faster than your mental model of it.

I stopped trying to maintain manual "map" files and just automated it. I built a small MCP server (`seu-claude`) that scans the repo structure in the background.

Now when I get lost in my own code, I just ask Claude: *"Map out the relationship between the billing module and the user service"* and it pulls the actual current state from the AST index. It saves a lot of cognitive load.

---

### u/Dymatizeee (Score: 1)

Skill issue

---

### u/gorimur (Score: -5)

Don't trust anyone who says you should know what your codebase does. Large systems can be built by manager-level decisions without anyone understanding them. This is delegation, and for some tasks AI can be a good engineer to delegate to.

Build specifications, use Cloud Code to visualize decisions, keep documentation up to date, and ask AI to sync code with the spec. Maintain high‑level declarative documentation of how the system should work, and periodically use Claude Code to verify the implementation.

---

> ### u/kex_ari (Score: 1)
> 
> 😂
> 
> ---
> 