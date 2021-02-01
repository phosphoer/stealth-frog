<?php

$file = fopen("../" . $_SERVER['HTTP_X_FILE_NAME'], 'w');

fwrite($file, $_POST["data"]);

?>