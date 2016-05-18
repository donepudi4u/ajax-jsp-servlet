<!DOCTYPE html>
<html lang="en">
<head>
<meta name="keywords"
	content="jQuery Splitter, AngularJS, Angular Splitter, AngularJS Splitter, Splitter Widget, Splitter, jqxSplitter" />
<title id='Description'>This demonstration shows how to trigger
	the jqxSplitter events.</title>
<link rel="stylesheet" href="css/jqx.base.css" type="text/css" />
<script type="text/javascript" src="js/jquery-1.11.1.min.js"></script>
<script type="text/javascript" src="js/jqxcore.js"></script>
<script type="text/javascript" src="js/jqxsplitter.js"></script>
<link rel="stylesheet" href="//code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.css">
<script src="//code.jquery.com/ui/1.11.4/jquery-ui.js"></script>
<script type="text/javascript">
	$(document).ready(function() {
		$('#mainSplitter').jqxSplitter({
			width : '100%',
			height : 500,
			panels : [ {
				size : 150
			} ]
		});
		$('#rightSplitter').jqxSplitter({
			width : '100%',
			height : '100%',
			orientation : 'horizontal',
			panels : [ {
				size : '60%',
				collapsible : false
			} ]
		});
		$('#byArea').click(function() {
			$.ajax({
				type : "POST",
				url : "SampleSecondServlet",
				contentType : "application/json",
				data : {
					test : JSON.stringify("Name:Dileep")
				},
				success : function(result) {
					$('#result2').html(result);
				}
			});
		});
		$(function() {
			$("#accordion").accordion();
		});
	});
</script>
</head>
<body>
	<div id="mainSplitter">
		<div>
			Left Panel
			<button id="byArea" name="byArea" title="By Area">By Area</button>
		</div>
		<div>
			<div id="rightSplitter">
				<div>Top-Right Panel</div>
				<div>
					Bottom-Right Panel
					<!-- <span id="result2"></span> -->
					<div id="accordion">
						<h3>Section 1</h3>
						<div>
							<p id="result2"></p>
						</div>
						<h3>Section 2</h3>
						<div>
							<p>Sed non urna. Donec et ante. Phasellus eu ligula.
								Vestibulum sit amet purus. Vivamus hendrerit, dolor at aliquet
								laoreet, mauris turpis porttitor velit, faucibus interdum tellus
								libero ac justo. Vivamus non quam. In suscipit faucibus urna.</p>
						</div>
						<h3>Section 3</h3>
						<div>
							<p>Nam enim risus, molestie et, porta ac, aliquam ac, risus.
								Quisque lobortis. Phasellus pellentesque purus in massa. Aenean
								in pede. Phasellus ac libero ac tellus pellentesque semper. Sed
								ac felis. Sed commodo, magna quis lacinia ornare, quam ante
								aliquam nisi, eu iaculis leo purus venenatis dui.</p>
							<ul>
								<li>List item one</li>
								<li>List item two</li>
								<li>List item three</li>
							</ul>
						</div>
						<h3>Section 4</h3>
						<div>
							<p>Cras dictum. Pellentesque habitant morbi tristique
								senectus et netus et malesuada fames ac turpis egestas.
								Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
								posuere cubilia Curae; Aenean lacinia mauris vel est.</p>
							<p>Suspendisse eu nisl. Nullam ut libero. Integer dignissim
								consequat lectus. Class aptent taciti sociosqu ad litora
								torquent per conubia nostra, per inceptos himenaeos.</p>
						</div>
					</div>

				</div>
			</div>
		</div>
	</div>
</body>
</html>