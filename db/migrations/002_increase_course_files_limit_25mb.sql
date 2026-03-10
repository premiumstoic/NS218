-- Increase course upload limit from 10MB to 25MB.
update storage.buckets
set file_size_limit = 26214400
where id = 'course-files';
