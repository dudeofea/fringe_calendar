import scrapy, json

scrapy.log.start(loglevel='DEBUG', logstdout=False)

class FringeSpider(scrapy.Spider):
	name = 'fringespider'
	start_urls = ['https://tickets.fringetheatre.ca/']
	events = []
	venues = {}
	times = []

	def __init__(self):
		scrapy.xlib.pydispatch.dispatcher.connect(self.spider_closed, scrapy.signals.spider_closed)

	#get all events / venues
	def parse(self, response):
		ind = 0
		for r in response.css('table.rso_venueEventsTable tbody tr'):
			e = {}
			e['id'] = ind
			e['link'] = 'https://tickets.fringetheatre.ca/' + r.css('td:first-child a').xpath('@href').extract()[0]
			e['name'] = r.css('td:first-child a').xpath('text()').extract()[0]
			e['type'] = r.css('td:nth-child(2)').xpath('text()').extract()[0]
			venue = r.css('td:nth-child(3)').xpath('text()').extract()[0].split(':')
			if(len(venue) == 1):
				e['venue_id'] = 1
			else:
				e['venue_id'] = int(venue[0])
			self.venues[e['venue_id']] = venue[-1].strip()
			self.events.append(e)
			#get all times for this event
			yield scrapy.Request(e['link'], callback=self.parse_event, meta={'id':ind})
			ind += 1

	#get all times for all events
	def parse_event(self, response):
		ind = response.meta['id']
		#get main photo
		try:
			self.events[ind]['img'] = response.css('.rso_venueEventsVenueTH_TOP img').xpath('@src').extract()[0]
		except IndexError:
			pass
		#use first ticket link to get duration
		link = 'https://tickets.fringetheatre.ca/'+response.css('#perfdateblock a').xpath('@href').extract()[0]
		yield scrapy.Request(link, callback=self.parse_duration, meta={'id':ind})
		#get dates / times
		for d in response.css('#perfdateblock tr > td'):
			t = {}
			try:
				try:
					t['day'] = int(d.xpath('text()').extract()[0])
					t['time'] = d.css('a').xpath('text()').extract()[0].strip()
				except ValueError:
					t['day'] = d.css('a').xpath('text()').extract()[0]
					t['time'] = d.xpath('//a/@title').extract()[0].strip()
			except IndexError:
				continue
			#print t
			t['event_id'] = ind
			self.times.append(t)

	#get duration of times
	def parse_duration(self, response):
		ind = response.meta['id']
		for h in response.css('.rso_venueEventsVenueTH_TOP'):
			dur = h.xpath('//h2[@itemprop="duration"]/text()').extract()[0].split(' ')
			self.events[ind]['minutes'] = int(dur[1])

	def spider_closed(self, spider):
		pass
		print "VENUES:", json.dumps(self.venues)
		print "EVENTS:", json.dumps(self.events)
		print "TIMES:", json.dumps(self.times)