---
title: Education
layout: site_default
nav_category: education
---
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
<hr>
<div id="ucla_ed">
	<h4 style="margin-bottom: 3px">University of California, Los Angeles</h4>
	<p style="margin-top:0px; margin-bottom:0px">Los Angeles, California</p>
	<p style="margin-top:0px">2018-2022</p>

	<p><b>Degree:</b> Bachelor's of Science in Computer Science</p>
	<p><b>Academic Achievements:</b></p>
		<ul>
			<li>SWE LA Scholarship Recipient (2020)</li>
			<li>Tau Beta Pi Engineering Society Member since Spring 2019</li>
			<li> UCLA Women in Engineering Scholarship (2019)</li>
			<li>UCLA SWE Scholarship (2019)</li>
		</ul>
	<p><b>On campus involvements:</b></p>
		<ul>
			<li>SuperMileage Vehicle in Bruin Racing (2018-Present)</li>
			<li>Society of Women Engineers (2018-Present)</li>
			<li>Creative Labs (2019-Present)</li>
			<li>Building Engineers and Mentors (2018-Present)</li>
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