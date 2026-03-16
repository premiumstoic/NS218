-- Add teacher analytics views

-- Quiz performance metrics: average scores and attempt counts per content item
create or replace view public.quiz_analytics as
select
  ci.id as content_item_id,
  ci.title as quiz_title,
  w.id as week_id,
  w.week_index,
  count(distinct qa.user_id)::integer as unique_attempts,
  count(qa.id)::integer as total_attempts,
  round(avg(qa.score)::numeric, 2) as average_score,
  min(qa.score)::numeric as min_score,
  max(qa.score)::numeric as max_score,
  round((sum(case when qa.score >= 70 then 1 else 0 end)::numeric / nullif(count(qa.id), 0) * 100)::numeric, 2) as pass_rate
from public.content_items ci
left join public.quiz_attempts qa on qa.content_item_id = ci.id
left join public.weeks w on w.id = ci.week_id
where ci.type = 'quiz'
group by ci.id, ci.title, w.id, w.week_index
order by w.week_index asc, ci.title asc;

-- Student quiz performance: score distribution and progress
create or replace view public.student_quiz_performance as
select
  p.id as user_id,
  p.display_name,
  p.email,
  count(distinct qa.content_item_id)::integer as quizzes_attempted,
  count(qa.id)::integer as total_attempts,
  round(avg(qa.score)::numeric, 2) as average_score,
  round((sum(case when qa.score >= 70 then 1 else 0 end)::numeric / nullif(count(qa.id), 0) * 100)::numeric, 2) as pass_rate
from public.profiles p
left join public.quiz_attempts qa on qa.user_id = p.id
where p.role = 'student'
group by p.id, p.display_name, p.email
order by p.display_name asc;

-- Engagement metrics: participation by week
create or replace view public.weekly_engagement as
select
  w.id as week_id,
  w.week_index,
  w.title as week_title,
  count(distinct ci.id)::integer as content_items_published,
  count(distinct sp.user_id)::integer as students_viewing,
  count(distinct qa.user_id)::integer as students_attempting_quizzes,
  round((count(distinct qa.user_id)::numeric / nullif((select count(*) from public.profiles where role = 'student'), 0))::numeric * 100, 2) as quiz_participation_rate
from public.weeks w
left join public.content_items ci on ci.week_id = w.id and ci.published_at is not null
left join public.student_progress sp on sp.content_item_id = ci.id
left join public.quiz_attempts qa on qa.content_item_id = ci.id
where w.published = true
group by w.id, w.week_index, w.title
order by w.week_index asc;
