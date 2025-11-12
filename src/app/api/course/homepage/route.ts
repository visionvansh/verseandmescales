// api/course/homepage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/auth';
import prisma, { PrismaTx } from '@/lib/prisma';

// Define types for sections
interface CustomSectionData {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  layout?: string;
  imageUrl?: string | null;
  imagePosition?: string;
  imageRounded?: boolean;
  imageBorder?: boolean;
  cards?: any[] | null;
  features?: any[] | null;
  buttonText?: string | null;
  buttonIcon?: string | null;
  buttonLink?: string | null;
  backgroundColor?: string;
  paddingTop?: string;
  paddingBottom?: string;
  titleWords?: any[] | null;
  descriptionWords?: any[] | null;
}

interface ProofImageData {
  imageUrl?: string;
  url?: string;
  title?: string;
  caption?: string | null;
  description?: string;
  altText?: string | null;
}

interface TestimonialData {
  name?: string;
  role?: string | null;
  company?: string | null;
  avatarUrl?: string;
  avatar?: string;
  thumbnail?: string | null;
  rating?: number;
  content?: string;
  text?: string;
  highlight?: string;
  featured?: boolean;
  instagramHandle?: string | null;
  linkedinUrl?: string | null;
  twitterHandle?: string | null;
}

interface FAQData {
  question?: string;
  answer?: string;
  category?: string | null;
}

interface SectionBadgeData {
  sectionId: string;
  type?: string;
  sectionType?: string;
  enabled?: boolean;
  text?: string;
  emoji?: string;
}

/**
 * GET /api/course-homepage
 * Fetch complete course homepage configuration
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    // ✅ Fetch both homepage AND course data
    const [homepage, course] = await Promise.all([
      prisma.courseHomepage.findUnique({
        where: { courseId },
        include: {
          customSections: { orderBy: { position: 'asc' } },
          proofSection: { include: { images: { orderBy: { position: 'asc' } } } },
          testimonials: { include: { testimonials: { orderBy: { position: 'asc' } } } },
          faqSection: { include: { faqs: { orderBy: { position: 'asc' } } } },
          footer: true,
          sectionBadges: true,
          courseStats: true,
        }
      }),
      prisma.course.findUnique({
        where: { id: courseId },
        select: {
          price: true,
          salePrice: true,
          saleEndsAt: true,
        }
      })
    ]);

    if (!homepage) {
      return NextResponse.json({ error: 'Homepage not found' }, { status: 404 });
    }

    // ✅ Pass course data to transform function
    return NextResponse.json(transformHomepageData(homepage, course), { status: 200 });

  } catch (error) {
    console.error('Error fetching course homepage:', error);
    return NextResponse.json({ error: 'Failed to fetch homepage data' }, { status: 500 });
  }
}

/**
 * POST /api/course-homepage
 * Save/Update complete course homepage configuration
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 });
    }

    const data = await request.json();
    const { courseId, ...homepageData } = data;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId, userId: user.id }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Use multiple smaller transactions instead of one giant transaction
    
    // 1. Update course metadata (outside transaction - simple update)
    await prisma.course.update({
      where: { id: courseId },
      data: { 
        lastEditedSection: 'homepage',
        updatedAt: new Date()
      }
    });

    // 2. Upsert main homepage
    const homepage = await prisma.courseHomepage.upsert({
      where: { courseId },
      update: {
        backgroundType: homepageData.backgroundType || 'black',
        backgroundColor: homepageData.backgroundColor || '#000000',
        gradientFrom: homepageData.gradientFrom || '#dc2626',
        gradientTo: homepageData.gradientTo || '#000000',
        primaryColor: homepageData.primaryColor || '#dc2626',
        secondaryColor: homepageData.secondaryColor || '#000000',
        darkMode: homepageData.darkMode ?? true,
        
        mainTitleLines: homepageData.mainTitleLines || 1,
        mainTitleLine1: homepageData.mainTitle?.line1 || '',
        mainTitleLine2: homepageData.mainTitle?.line2 || '',
        mainTitleLine3: homepageData.mainTitle?.line3 || '',
        mainTitleHighlighted: homepageData.mainTitle?.highlightedWords || [],
        mainTitleLine1Words: homepageData.mainTitle?.line1Words || null,
        mainTitleLine2Words: homepageData.mainTitle?.line2Words || null,
        mainTitleLine3Words: homepageData.mainTitle?.line3Words || null,
        
        subheadingLines: homepageData.subheadingLines || 1,
        subheadingText: homepageData.subheading?.text || '',
        subheadingHighlighted: homepageData.subheading?.highlightedWords || [],
        subheadingSentences: homepageData.subheading?.highlightedSentences || [],
        subheadingWords: homepageData.subheading?.words || null,
        
        videoEnabled: homepageData.videoEnabled ?? true,
        videoUrl: homepageData.videoUrl || '',
        videoTitle: homepageData.videoTitle || '',
        videoDescription: homepageData.videoDescription || '',
        videoDuration: homepageData.videoDuration || '',
        
        ctaButtonText: homepageData.ctaButtonText || 'START YOUR JOURNEY',
        ctaButtonIcon: homepageData.ctaButtonIcon || 'FaRocket',
        
        statsEnabled: homepageData.statsEnabled ?? true,
        
        updatedAt: new Date()
      },
      create: {
        courseId,
        userId: user.id,
        backgroundType: homepageData.backgroundType || 'black',
        backgroundColor: homepageData.backgroundColor || '#000000',
        gradientFrom: homepageData.gradientFrom || '#dc2626',
        gradientTo: homepageData.gradientTo || '#000000',
        primaryColor: homepageData.primaryColor || '#dc2626',
        secondaryColor: homepageData.secondaryColor || '#000000',
        darkMode: homepageData.darkMode ?? true,
        mainTitleLines: homepageData.mainTitleLines || 1,
        mainTitleLine1: homepageData.mainTitle?.line1 || '',
        mainTitleLine2: homepageData.mainTitle?.line2 || '',
        mainTitleLine3: homepageData.mainTitle?.line3 || '',
        mainTitleHighlighted: homepageData.mainTitle?.highlightedWords || [],
        subheadingLines: homepageData.subheadingLines || 1,
        subheadingText: homepageData.subheading?.text || '',
        subheadingHighlighted: homepageData.subheading?.highlightedWords || [],
        videoEnabled: homepageData.videoEnabled ?? true,
        videoUrl: homepageData.videoUrl || '',
        ctaButtonText: homepageData.ctaButtonText || 'START YOUR JOURNEY',
        ctaButtonIcon: homepageData.ctaButtonIcon || 'FaRocket',
        statsEnabled: homepageData.statsEnabled ?? true,
      }
    });

    // 3. Handle Custom Sections (separate transaction)
    if (homepageData.customSections && Array.isArray(homepageData.customSections)) {
      await prisma.$transaction(async (tx: PrismaTx) => {
        await tx.courseCustomSection.deleteMany({
          where: { homepageId: homepage.id }
        });

        if (homepageData.customSections.length > 0) {
          await tx.courseCustomSection.createMany({
            data: homepageData.customSections.map((section: CustomSectionData, index: number) => ({
              homepageId: homepage.id,
              sectionId: section.id,
              position: index,
              title: section.title || '',
              titleWords: section.titleWords || null,
              description: section.description || section.subtitle || '',
              descriptionWords: section.descriptionWords || null,
              layout: section.layout || 'text-image',
              imageUrl: section.imageUrl || null,
              imagePosition: section.imagePosition || 'right',
              imageRounded: section.imageRounded || false,
              imageBorder: section.imageBorder || false,
              features: section.cards || section.features || null,
              buttonText: section.buttonText || null,
              buttonIcon: section.buttonIcon || null,
              buttonLink: section.buttonLink || null,
              backgroundColor: section.backgroundColor || 'transparent',
              paddingTop: section.paddingTop || 'normal',
              paddingBottom: section.paddingBottom || 'normal',
            }))
          });
        }
      });
    }

    // 4. Handle Proof Section (separate transaction)
    if (homepageData.proofSectionEnabled !== undefined) {
      await prisma.$transaction(async (tx: PrismaTx) => {
        if (homepageData.proofSectionEnabled) {
          const proofSection = await tx.courseProofSection.upsert({
            where: { homepageId: homepage.id },
            update: {
              enabled: true,
              title: homepageData.proofSectionTitle || '',
              titleWords: homepageData.proofSectionTitleWords || null
            },
            create: {
              homepageId: homepage.id,
              enabled: true,
              title: homepageData.proofSectionTitle || '',
              titleWords: homepageData.proofSectionTitleWords || null
            }
          });

          if (homepageData.proofImages && Array.isArray(homepageData.proofImages)) {
            await tx.courseProofImage.deleteMany({
              where: { proofSectionId: proofSection.id }
            });

            if (homepageData.proofImages.length > 0) {
              await tx.courseProofImage.createMany({
                data: homepageData.proofImages.map((img: ProofImageData, index: number) => ({
                  proofSectionId: proofSection.id,
                  imageUrl: img.imageUrl || img.url || '',
                  caption: img.title || img.caption || null,
                  altText: img.description || img.altText || null,
                  position: index
                }))
              });
            }
          }
        } else {
          await tx.courseProofSection.deleteMany({
            where: { homepageId: homepage.id }
          });
        }
      });
    }

    // 5. Handle Testimonials Section (separate transaction)
    if (homepageData.testimonialsEnabled !== undefined) {
      await prisma.$transaction(async (tx: PrismaTx) => {
        if (homepageData.testimonialsEnabled) {
          const testimonialSection = await tx.courseTestimonialSection.upsert({
            where: { homepageId: homepage.id },
            update: {
              enabled: true,
              title: homepageData.testimonialsTitle || '',
              titleWords: homepageData.testimonialsTitleWords || null
            },
            create: {
              homepageId: homepage.id,
              enabled: true,
              title: homepageData.testimonialsTitle || '',
              titleWords: homepageData.testimonialsTitleWords || null
            }
          });

          if (homepageData.testimonials && Array.isArray(homepageData.testimonials)) {
            await tx.courseTestimonial.deleteMany({
              where: { testimonialSectionId: testimonialSection.id }
            });

            if (homepageData.testimonials.length > 0) {
              await tx.courseTestimonial.createMany({
                data: homepageData.testimonials.map((testimonial: TestimonialData, index: number) => ({
                  testimonialSectionId: testimonialSection.id,
                  name: testimonial.name || '',
                  role: testimonial.role || null,
                  company: testimonial.company || null,
                  avatarUrl: testimonial.avatarUrl || testimonial.avatar || testimonial.thumbnail || null,
                  rating: testimonial.rating || 5,
                  content: testimonial.content || testimonial.text || testimonial.highlight || '',
                  featured: testimonial.featured || false,
                  position: index,
                  instagramHandle: testimonial.instagramHandle || null,
                  linkedinUrl: testimonial.linkedinUrl || null,
                  twitterHandle: testimonial.twitterHandle || null
                }))
              });
            }
          }
        } else {
          await tx.courseTestimonialSection.deleteMany({
            where: { homepageId: homepage.id }
          });
        }
      });
    }

    // 6. Handle FAQ Section (separate transaction)
    if (homepageData.faqEnabled !== undefined) {
      await prisma.$transaction(async (tx: PrismaTx) => {
        if (homepageData.faqEnabled) {
          const faqSection = await tx.courseFAQSection.upsert({
            where: { homepageId: homepage.id },
            update: {
              enabled: true,
              title: homepageData.faqTitle || 'GOT QUESTIONS?',
              titleWords: homepageData.faqTitleWords || null
            },
            create: {
              homepageId: homepage.id,
              enabled: true,
              title: homepageData.faqTitle || 'GOT QUESTIONS?',
              titleWords: homepageData.faqTitleWords || null
            }
          });

          if (homepageData.faqs && Array.isArray(homepageData.faqs)) {
            await tx.courseFAQ.deleteMany({
              where: { faqSectionId: faqSection.id }
            });

            if (homepageData.faqs.length > 0) {
              await tx.courseFAQ.createMany({
                data: homepageData.faqs.map((faq: FAQData, index: number) => ({
                  faqSectionId: faqSection.id,
                  question: faq.question || '',
                  answer: faq.answer || '',
                  position: index,
                  category: faq.category || null
                }))
              });
            }
          }
        } else {
          await tx.courseFAQSection.deleteMany({
            where: { homepageId: homepage.id }
          });
        }
      });
    }

    // 7. Handle Footer (separate transaction)
    await prisma.courseFooter.upsert({
      where: { homepageId: homepage.id },
      update: {
        title: homepageData.footerTitle || '',
        titleWords: homepageData.footerTitleWords || null,
        description: homepageData.footerDescription || '',
        descriptionWords: homepageData.footerDescriptionWords || null,
        price: homepageData.footerPrice || '',
        salePrice: homepageData.footerSalePrice || null,
        currency: homepageData.footerCurrency || 'USD',
        buttonText: homepageData.ctaButtonText || 'GET STARTED NOW',
        buttonIcon: homepageData.ctaButtonIcon || 'FaRocket',
        buttonLink: homepageData.footerButtonLink || null,
        icons: homepageData.footerIcons || null,
        showSocialProof: homepageData.footerShowSocialProof ?? true,
        showGuarantee: homepageData.footerShowGuarantee ?? true,
        showPaymentMethods: homepageData.footerShowPaymentMethods ?? true
      },
      create: {
        homepageId: homepage.id,
        title: homepageData.footerTitle || '',
        titleWords: homepageData.footerTitleWords || null,
        description: homepageData.footerDescription || '',
        descriptionWords: homepageData.footerDescriptionWords || null,
        price: homepageData.footerPrice || '',
        salePrice: homepageData.footerSalePrice || null,
        buttonText: homepageData.ctaButtonText || 'GET STARTED NOW',
        buttonIcon: homepageData.ctaButtonIcon || 'FaRocket',
        icons: homepageData.footerIcons || null
      }
    });

    // 8. Handle Section Badges (separate transaction)
    if (homepageData.sectionBadges && Array.isArray(homepageData.sectionBadges)) {
      await prisma.$transaction(async (tx: PrismaTx) => {
        await tx.courseSectionBadge.deleteMany({
          where: { homepageId: homepage.id }
        });

        const validBadges = homepageData.sectionBadges.filter((badge: SectionBadgeData) => 
          badge.sectionId && (badge.enabled || badge.text)
        );

        if (validBadges.length > 0) {
          await tx.courseSectionBadge.createMany({
            data: validBadges.map((badge: SectionBadgeData) => ({
              homepageId: homepage.id,
              sectionId: badge.sectionId,
              sectionType: badge.type || badge.sectionType || 'customSection',
              enabled: badge.enabled || false,
              text: badge.text || '',
              emoji: badge.emoji || '🔥'
            })),
            skipDuplicates: true
          });
        }
      });
    }

    // 9. Handle Course Stats (separate upsert)
    if (homepageData.courseStats) {
      await prisma.courseStats.upsert({
        where: { homepageId: homepage.id },
        update: {
          activeStudents: homepageData.courseStats.activeStudents || 0,
          courseRating: homepageData.courseStats.courseRating || 0.0,
          monthlyIncome: homepageData.courseStats.monthlyIncome || '\$0',
          avgGrowth: homepageData.courseStats.avgGrowth || '0',
          totalEnrollments: homepageData.courseStats.totalEnrollments || 0,
          completionRate: homepageData.courseStats.completionRate || 0.0,
          averageProgress: homepageData.courseStats.averageProgress || 0.0,
          lastCalculated: new Date()
        },
        create: {
          homepageId: homepage.id,
          userId: user.id,
          activeStudents: homepageData.courseStats.activeStudents || 0,
          courseRating: homepageData.courseStats.courseRating || 0.0,
          monthlyIncome: homepageData.courseStats.monthlyIncome || '\$0',
          avgGrowth: homepageData.courseStats.avgGrowth || '0'
        }
      });
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Homepage saved successfully',
        id: homepage.id 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error saving course homepage:', error);
    return NextResponse.json(
      { error: 'Failed to save homepage data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Transform database format to frontend format
 */
function transformHomepageData(homepage: any, course?: any) {
  return {
    id: homepage.id,
    
    // Background
    backgroundType: homepage.backgroundType,
    backgroundColor: homepage.backgroundColor,
    gradientFrom: homepage.gradientFrom,
    gradientTo: homepage.gradientTo,
    primaryColor: homepage.primaryColor,
    secondaryColor: homepage.secondaryColor,
    darkMode: homepage.darkMode,
    
    // Main Title
    mainTitle: {
      line1: homepage.mainTitleLine1,
      line2: homepage.mainTitleLine2,
      line3: homepage.mainTitleLine3,
      highlightedWords: homepage.mainTitleHighlighted,
      line1Words: homepage.mainTitleLine1Words,
      line2Words: homepage.mainTitleLine2Words,
      line3Words: homepage.mainTitleLine3Words,
    },
    mainTitleLines: homepage.mainTitleLines,
    
    // Subheading
    subheading: {
      text: homepage.subheadingText,
      highlightedWords: homepage.subheadingHighlighted,
      highlightedSentences: homepage.subheadingSentences,
      words: homepage.subheadingWords,
    },
    subheadingLines: homepage.subheadingLines,
    
    // Video
    videoEnabled: homepage.videoEnabled,
    videoUrl: homepage.videoUrl,
    videoTitle: homepage.videoTitle,
    videoDescription: homepage.videoDescription,
    videoDuration: homepage.videoDuration,
    
    // CTA Button
    ctaButtonText: homepage.ctaButtonText,
    ctaButtonIcon: homepage.ctaButtonIcon,
    
    // Stats
    statsEnabled: homepage.statsEnabled,
    
    // Custom Sections
    customSections: homepage.customSections?.map((section: any) => ({
      id: section.sectionId,
      order: section.position,
      title: section.title,
      titleWords: section.titleWords,
      subtitle: section.description,
      descriptionWords: section.descriptionWords,
      cards: section.features || [],
      layout: section.layout,
      imageUrl: section.imageUrl,
      imagePosition: section.imagePosition,
      imageRounded: section.imageRounded,
      imageBorder: section.imageBorder,
      buttonText: section.buttonText,
      buttonIcon: section.buttonIcon,
      buttonLink: section.buttonLink,
      backgroundColor: section.backgroundColor,
      paddingTop: section.paddingTop,
      paddingBottom: section.paddingBottom,
    })) || [],
    
    // Proof Section
    proofSectionEnabled: homepage.proofSection?.enabled || false,
    proofSectionTitle: homepage.proofSection?.title || '',
    proofSectionTitleWords: homepage.proofSection?.titleWords || [],
    proofImages: homepage.proofSection?.images?.map((img: any) => ({
      id: img.id,
      order: img.position,
      imageUrl: img.imageUrl,
      title: img.caption || '',
      description: img.altText || '',
      category: img.category || null,
      showCategory: img.showCategory ?? true,
    })) || [],
    
    // Testimonials
    testimonialsEnabled: homepage.testimonials?.enabled || false,
    testimonialsTitle: homepage.testimonials?.title || '',
    testimonialsTitleWords: homepage.testimonials?.titleWords || [],
    testimonials: homepage.testimonials?.testimonials?.map((t: any) => ({
      id: t.id,
      order: t.position,
      name: t.name,
      role: t.role,
      company: t.company,
      avatar: t.avatarUrl,
      thumbnail: t.avatarUrl,
      rating: t.rating,
      text: t.content,
      content: t.content,
      highlight: t.content,
      featured: t.featured,
      instagramHandle: t.instagramHandle,
      linkedinUrl: t.linkedinUrl,
      twitterHandle: t.twitterHandle,
      customFields: [],
      videoFile: t.videoFile || null,
      videoLength: t.videoLength || null,
    })) || [],
    
    // FAQ
    faqEnabled: homepage.faqSection?.enabled || false,
    faqTitle: homepage.faqSection?.title || 'GOT QUESTIONS?',
    faqTitleWords: homepage.faqSection?.titleWords || [],
    faqs: homepage.faqSection?.faqs?.map((faq: any) => ({
      id: faq.id,
      order: faq.position,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    })) || [],
    
    // Footer - ✅ Get price from course, not footer
    footerTitle: homepage.footer?.title || '',
    footerTitleWords: homepage.footer?.titleWords || [],
    footerDescription: homepage.footer?.description || '',
    footerDescriptionWords: homepage.footer?.descriptionWords || [],
    footerPrice: course?.price || homepage.footer?.price || '',
    footerSalePrice: course?.salePrice || homepage.footer?.salePrice || '',
    saleEndsAt: course?.saleEndsAt || null, // ✅ From Course model
    footerCurrency: homepage.footer?.currency || 'USD',
    footerIcons: homepage.footer?.icons || [],
    footerShowSocialProof: homepage.footer?.showSocialProof ?? true,
    footerShowGuarantee: homepage.footer?.showGuarantee ?? true,
    footerShowPaymentMethods: homepage.footer?.showPaymentMethods ?? true,
    
    // Section Badges
    sectionBadges: homepage.sectionBadges?.map((badge: any) => ({
      sectionId: badge.sectionId,
      type: badge.sectionType,
      enabled: badge.enabled,
      text: badge.text,
      emoji: badge.emoji,
    })) || [],
    
    // Course Stats
    courseStats: homepage.courseStats ? {
      activeStudents: homepage.courseStats.activeStudents,
      courseRating: homepage.courseStats.courseRating,
      monthlyIncome: homepage.courseStats.monthlyIncome,
      avgGrowth: homepage.courseStats.avgGrowth,
      totalEnrollments: homepage.courseStats.totalEnrollments,
      completionRate: homepage.courseStats.completionRate,
      averageProgress: homepage.courseStats.averageProgress,
      lastCalculated: homepage.courseStats.lastCalculated,
    } : {
      activeStudents: 0,
      courseRating: 0.0,
      monthlyIncome: '\$0',
      avgGrowth: '0',
      totalEnrollments: 0,
      completionRate: 0.0,
      averageProgress: 0.0,
    },
  };
}