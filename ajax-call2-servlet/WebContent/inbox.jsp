<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
	pageEncoding="ISO-8859-1"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>Insert title here</title>
<script type="text/javascript" src="js/jquery-1.7.2.min.js"> </script>
<link rel="stylesheet" href="css/inbox.css" type="text/css">
<script type="text/javascript">

$(function () {
    $("#maincontent > div:gt(0)").hide();
    $("#menu a").on("click", function (e) {
        var href = $(this).attr("href");
        $("#maincontent > " + href).show();
        $("#maincontent > :not(" + href + ")").hide();
    });
});

</script>
</head>
<body>
	<div id="page">
		<div id="maincontent">
			<div id="firstcontent">firstcontent</div>
			<div id="secondcontent">secondcontent</div>
		</div>
		<div id="menuleftcontent">
			<ul id="menu">
				<li><a href="#firstcontent">first</a></li>
				<li><a href="#secondcontent">second</a></li>
			</ul>
		</div>
		<div id="clearingdiv"></div>
	</div>
</body>
</html>