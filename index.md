---
title:
layout: site_default
nav_category: home
---

<div id="aboutMe">
    <div class="row">
        <div class="column_2">
            <h2>Hey there!</h2>
            <p>I'm Allison Chen, and I'm originally from Chicago, Illinois. Currently, I'm a fourth year undergraduate computer science student at University of California, Los Angeles with a minor in cognitive science. I'm also involved in research on campus with the UCLA Vision Lab under Dr. Stefano Soatto.</p>

            <p>I'm interested in pursuing a PhD in the intersection of computer science and cognitive science to improve computer vision techniques inspired by our own systems. In the long term, I would love to work on accessibility technology or similarly impactful applications of this technolog. Outside of research and academics, I love to dance, cook, read, and enjoy the outdoors!
            </p>
        </div>
        <div class="column_2">
            <img src="assets/images/index/Pro_pic2.jpg" id="profile-image" alt="LinkedIn Headshot">
        </div>
    </div>
</div>

<br>
<hr>

<h2 class="blogpost title standOut">Education</h2>
<div>
	<div class="centered_row">
		<div id="ucla_seal" class="seal_div active_ed" onclick="show_ucla()">
			<img src="assets/images/education/ucla_seal.png" alt="UCLA seal" class="images full">
		</div>
		<div id="shs_seal" class="seal_div" onclick="show_shs()">
			<img src="assets/images/education/shs_logo.png" alt="SHS logo" class="images full">
		</div>
	</div>
	<script>
		function show_ucla()
		{
			document.getElementById("ucla_ed").style.display = "block";
			document.getElementById("ucla_seal").classList.add("active_ed");
			document.getElementById("shs_ed").style.display = "none";
			document.getElementById("shs_seal").classList.remove("active_ed");
		}
		function show_shs()
		{
			document.getElementById("ucla_ed").style.display = "none";
			document.getElementById("ucla_seal").classList.remove("active_ed");
			document.getElementById("shs_ed").style.display = "block";
			document.getElementById("shs_seal").classList.add("active_ed");
		}
	</script>
</div>
<!-- <hr> -->
<div id="ucla_ed">
	<h4 style="margin-bottom: 3px">University of California, Los Angeles</h4>
	<p style="margin-top:0px; margin-bottom:0px">Los Angeles, California</p>
	<p style="margin-top:0px">2018-2022</p>

	<p><b>Degree:</b> Bachelor's of Science in Computer Science with a minor in Cognitive Science</p>
	<p><b>Academic Achievements:</b></p>
		<ul>
			<li>SWE LA Scholarship Recipient (2020)</li>
			<li>Tau Beta Pi Engineering Society Member since Spring 2019</li>
			<li> UCLA Women in Engineering Scholarship (2019)</li>
			<li>UCLA SWE Scholarship (2019)</li>
		</ul>
	<p><b>On campus involvements:</b></p>
		<ul>
			<li>Undergraduate researcher in the UCLA Vision Lab (2020-Present)</li>
			<li>Society of Women Engineers (2018-Present)</li>
			<li>SuperMileage Vehicle in Bruin Racing (2018-2020)</li>
			<li>Creative Labs (2019-2020)</li>
			<li>Building Engineers and Mentors (2018-2019)</li>
			<li>Intramurals (frisbee and volleyball)</li>
		</ul>
	<p><b>Favorite thing about UCLA:</b> The school's concern for students' physical and mental health in addition to academic excellence! And B-Plate!</p>
</div>
<div id="shs_ed">
	<h4 style="margin-bottom: 3px">Adlai E. Stevenson High School</h4>
	<p style="margin-top:0px; margin-bottom:0px">Lincolnshire, Illinois</p>
	<p style="margin-top:0px">2014-2018</p>
	<p><b>Academic Achievements:</b></p>
		<ul>
			<li>Illinois Principal's Association Student Recognition (2018)</li>
			<li>Illinois Science Teacher's Association Excellence in Science Award (2018)</li>
			<li>Gold Honor Roll (All A's) for 8 semesters</li>
		</ul>
	<p><b>On campus involvements:</b></p>
		<ul>
			<li>Freshman Mentor Program (2016-2018)</li>
			<li>Misfits Hip Hop Company (2016-2018)</li>
			<li>VEX Robotics (2015-2018)</li>
			<li>Food Revolution Club (2015-2018)</li>
			<li>Concert Dance Company (2015-2018)</li>
		</ul>
	<p><b>Favorite thing about Stevenson:</b> I really loved forming close connections with my teachers! They care about their students and I felt comfortable talking about my personal struggles with many of them.</p>
</div>

<!-- <section id="intro">
    <h2>Inspiration</h2>
    <p>My love for engineering and innovation started in fifth grade when I joined an all girls FIRST Lego League team through Girl Scouts. I continued this through middle school where my team won the Illinois Championship in 2012 and 2014 and was the runner up team and nationals in 2014. Here, enjoy some embarrassing pictures of middle school me:
    </p>
    <img src="assets/images/index/baby_moovers.jpg" class="images half" alt="beginning of robotics">
    <p class="caption">My FIRST Lego League Robotics team circa 2013</p>
    <p>In high school, I continued competing in robotics first through FIRST Tech Challenge then through VEX robotics. In robotics, I was able to explore both the building/mechanical side as well as the coding/computer science side and when it was time to apply for college I reached this conclusion: I really loved both! On one hand, I enjoyed creating a design for what the robot would look like and how it would function and being able to turn that into reality. On the other, I loved actually giving the robot life through coding and innovating new ways to allow the robot to complete various tasks. Thus, I went into college with an open mind and exploring both to see which I liked better.</p>
    <p>Long story short, as you know, I chose computer science. I really loved the logical thinking behind this field and applying constant principles in new and innovative ways to create faster, better, and more complex programs. As I learned more about the field, I found myself always inquiring to learn even more and it soon dawned on me that this was something I was actually interested in. Especially with how prevalent technology is in our daily lives, I truly believe that my career will be able to postively impact the most people personally through developing new software and technologies :)</p>
</section> -->