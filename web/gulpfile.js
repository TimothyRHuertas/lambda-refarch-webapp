var gulp = require('gulp');

var concat = require('gulp-concat');  
var rename = require('gulp-rename');  
var uglify = require('gulp-uglify');  


var jsFiles = ['jquery.min.js'
	,'Chart.min.js'
	,'aws-sdk-2.6.4.min.js'
	,'lib/axios/dist/axios.standalone.js'
	,'lib/CryptoJS/rollups/hmac-sha256.js'
	,'lib/CryptoJS/rollups/sha256.js'
	,'lib/CryptoJS/components/hmac.js'
	,'lib/CryptoJS/components/enc-base64.js'
	,'lib/url-template/url-template.js'
	,'lib/apiGatewayCore/sigV4Client.js'
	,'lib/apiGatewayCore/apiGatewayClient.js'
	,'lib/apiGatewayCore/simpleHttpClient.js'
	,'lib/apiGatewayCore/utils.js'
	,'apigClient.js'
	// ,'share-button.min.js'
	,'refresh.js'],  
    jsDest = '';

gulp.task('scripts', function() {  
    return gulp.src(jsFiles)
        .pipe(concat('scripts.js'))
        .pipe(gulp.dest(jsDest))
        .pipe(rename('scripts.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(jsDest));
});