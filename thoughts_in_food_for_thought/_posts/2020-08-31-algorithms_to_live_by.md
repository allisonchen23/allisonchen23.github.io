---
title: "Algorithms to Live By"
date: 2020-08-31 06:00:40 -0500
categories: "thoughts"
permalink: "/algorithms_to_live_by/"
layout: post_layout
---


Saying it's been a while since I've posted on this blog is an understatement, but better late than never right? Recently, I've been reading the book *Algorithms to Live By* by Brian Christian and Tom Griffiths with my good friend, Ash Nagarajan. We've been doing an informal sort of book club where each week we'll read a few chapter and discuss them. I was really intrigued by this book because it essentially takes well-known computer science principles and discusses what we can learn in our every day lives. And partly to share with you and partly so I myself don't forget these really unique lessons, I wanted to make a blog post about it--a TL;DR of the book, if you will.

If you plan on reading the book, STOP HERE! The rest of this post has many spoilers and I want you to enjoy the book if you're going to read it. Otherwise, by all means, keep reading.

I'll try to keep it short, but I'm going to list my main takeaways from each chapter, and at the end do an overall reflection of my thoughts. Hope you enjoy!

### Chapter 1: Optimal Stopping
* 37% Rule: In the most basic look then leap scenario, it's optimal to look without making a decision until you've reached 37% of your pool (whether measured by number of items, time, etc) then you choose the next candidate that's better than any you've seen so far
    * This is when you have no information of candidates before seeing them
* Remember that often taking the time to search before deciding has an opportunity cost
* In reality, as humans we tend to stop looking prematurely than rational due to opportunity cost of time. Time is another constraint in every decision making process

### Chapter 2: Explore/Exploit
* Exploring: checking out new things
* Exploiting: going to/using the things you already know you love
* Whether you should explore or exploit depends on how much time/resources are left
* As people we tend to overexplore, we want to be confident before we decide
* We see principles of explore/exploit in people's lives: young kids tend to explore more, try new things while adults and elderly tend to exploit what they know and are comfortable with

### Chapter 3: Sorting
* Sort and search come hand in hand. Usually, we should sort just enough that optimizes sorting *and* searching. It's wasteful to sort something you will never search

### Chapter 4: Caching
* Our nightstand is a cache for our dresser is a cache for our closet is a cache for...
* In computer science and humans, we follow a Least Recently Used principle: things we hear/learn more recently are more easily retrievable than things we talked about a month ago
* We can use caching to make our lives easier: in our homes, put things where we'd use them, not necessarily where is "neat"
* That pile of clothes on my desk chair is just me being efficient and caching them :)
* It's not necessarily that memory degrades over time, but the amount of information increases without an increase in computational resources... of course performance will decrease!

### Chapter 5: Scheduling
* Before deciding on a schedule, you need a goal or metric to measure its effectiveness by!
* To maximize the number of items you finish: order them by shortest processing time (weighty itmes at the end)
* Procrastination is really a great solution to meet the "wrong" metric: you do as many outstanding tasks as possible rather than the big weighty ones
* Priority Inheritance: if a low priority task is inhibiting a high priority task, it becomes high priority
* You will never know what the future holds, so see your schedule as a guess, not a plan, and embrace the uncertainty :)
* There's always overhead in switching tasks/being interrupted --> too much interruption leads to thrashing where *nothing* gets done. Mitigate this by coalescing your interruptions (ex: office hours!)

### Chapter 6: Bayes' Rule
* To predict the future with Bayes' Rule, you need to have some knowledge of the past
* Now if you know absolutely nothing, then Copernican's Principle suggests we can expect that we are currently halfway through something's total duration.
* Power Law Distribution: rich get richer; can be predicted with Multiplicative Rule
* Normal Distribution: use natural average as your guide; predict with Average Rule
* Erlang Distribution: kinda skewed right type of distribution; predict with Additive Rule (5 more minutes... 5 more minutes!)
* Knowing only averages isn't enough for predictions, you need the distribution too!
* Our views on the world are highly influenced by the distribution of our past experiences (Marshmallow gratification experiment, how much we see plane crashes vs car crashes on the news)

### Chapter 7: Overfitting
* There is a need to generalize what to expect by not tuning your model to *exactly* fit past experiences (use less factors!)
* Overfitting happens a lot in real life when we determine success solely by metrics instead of letting various metrics lead us to conclusions of success (ie focusing on weight to equate being healthy or number of sales this month to being a good employee)
* Cross-validation is similar to cross training! Apply skills in new context
* First ideate with big strokes and large ideas (think less!) then tune to finer point brushes. Thinking about details right away can detract from the big picture

### Chapter 8: Relaxation
* With all the constraints, some problems are so difficult that you need to let something go in order to get a good-enough solution
* Sometimes it's okay to "color outside the lines" or bend the rules with **Langrangian Relaxation**. *"Do it or else!"* becomes *"Or else what?"*
* Also, lesson from this chapter: just chill out sometimes

### Chapter 9: Randomness
* Including a bit of randomness in life not only makes things interesting, but also lets you get out of the valleys (such as if you don't randomly try something new, how do you know you wouldn't like it more than what you currently have?)
* General tips are to front load your randomness and then decrease it over time (like starting with a larger learning rate and decreasing it in machine learning!)

### Chapter 10: Networking
* Exponential Backoff teaches us to forgive right away, but each time a "failure" (someone betrays your trust, is flaky, etc) happens again, exponentially distance yourself from the situation. Maybe this means rescheduling in a week, then two weeks, etc.
* Additive Increase, Multiplicative Decrease teaches us to slowly increase throughput until at maximum capacity, then cut the throughput in 2 and slowly grow it up again. This helps control the flow of things especially in dynamic environments.
* Backflow (basically acknowledgements) are just important in communication! Getting that signal that your audience is listening and attentive helps communication and build relationships. I find this *especially* relevant during COVID

### Chapter 11: Game Theory
* We very much live in the Tragedy of the Commons (think of environmental resources). And in these contexts, I think it's especially important to adopt the philosophy of living your life how you would want others to live.
* When the dominant strategy puts people in a worse position, it's time to change the mechanism and rules of the game.
* "Seek out games where honesty is the dominant strategy. Then just be yourself." -p225

### Conclusion: Computational Kindness
* Make life easier for others computationally! Such as, when scheduling a time, give them some proposals that they can **verify** whether or not they're free instead of having to find times on their own.
* Basically having TOO many options is computationally difficult for people
* Being rational means making concessions instead of trying to factor in *every little detail* into our lives and problems

### Overall Thoughts
I really liked how the authors took computer science algorithms, something that is notoriously logic based and applied it into the more flexible realm of our daily lives. To me, it made these big scary algorithms seem a lot more familiar because we can and do utilize very similar concepts in our own lives, whether we do it consciously or not. However, I think the authors don't really warn about what would happen if people *solely* guided their lives by these principles and how that could lead people to lose the beauty of the unexpected in life.

As an example, the chapter about caching suggests that libraries should be "turned inside out" because the books that are last recently used are most likely going to be checked out the soonest, thus it's more efficient to put them in the front of the library as opposed to back to the shelves. While from a metric of efficiency, this may be accurate, organizing a library this way loses the likelihood of stumbling across a wonderful but less popular book; it increases everyone's exploitation and decreases the exploration (referring back to a concept from an earlier chapter).

This idea kind of reminds me of ads, how the things that the providers think we would like always appear at the front, reinforcing the bubble of comfort that we already live in. Or how your 'Discover Weekly' playlists on Spotify never really seem to be that different from what you already listen to.

Still, I really loved the way the authors explained each algorithm in a friendly and inviting way and connected it to real life situations and examples. 10/10 recommend!

### Best Quotes

* "If you're flammable and have legs, you are never blocking a fire exit." -Hedberg, Chapter 5